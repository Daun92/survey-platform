import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuestionType } from '@survey/shared';
import type { AiGenerateResponse, TemplateQuestion } from '@survey/shared';
import { GenerateSurveyDto } from './dto/generate-survey.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import * as fs from 'fs';
import * as path from 'path';

interface StreamEvent {
  type: 'text' | 'questions' | 'error';
  data: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
  }

  async *chatStream(dto: ChatMessageDto): AsyncGenerator<StreamEvent> {
    if (!this.apiKey) {
      // Mock streaming response when no API key
      yield* this.mockChatStream(dto);
      return;
    }

    try {
      yield* this.claudeChatStream(dto);
    } catch (err) {
      this.logger.warn('AI chat stream failed, falling back to mock', err);
      yield* this.mockChatStream(dto);
    }
  }

  private async *claudeChatStream(dto: ChatMessageDto): AsyncGenerator<StreamEvent> {
    const existingQuestionsContext = dto.existingQuestions?.length
      ? `\n\n현재 설문에 이미 포함된 질문 목록:\n${dto.existingQuestions.map((q, i) => `${i + 1}. [${q.type}] ${q.title}`).join('\n')}\n위 질문들과 중복되지 않는 새로운 질문을 생성해주세요.`
      : '';

    const systemPrompt = `당신은 설문조사 설계 전문가 AI 어시스턴트입니다.
사용자와 대화하며 설문 질문을 함께 설계합니다.

규칙:
1. 한국어로 응답하세요.
2. 사용자의 요청에 따라 적절한 설문 질문을 제안하세요.
3. 질문을 생성할 때는 반드시 아래 형식으로 JSON 블록을 포함하세요:

<<<QUESTIONS>>>
[
  {
    "type": "radio|checkbox|short_text|long_text|dropdown|linear_scale|date|ranking",
    "title": "질문 텍스트",
    "description": null,
    "required": true,
    "order": 0,
    "options": {},
    "validation": { "required": true }
  }
]
<<<END_QUESTIONS>>>

radio/checkbox/dropdown 타입에는 choices를 포함하세요:
"options": { "choices": [{ "id": "opt1", "label": "선택지 1", "value": "opt1", "order": 0 }] }

linear_scale 타입에는:
"options": { "linearScale": { "min": 1, "max": 5, "minLabel": "낮음", "maxLabel": "높음", "step": 1 } }

4. 일반 대화 텍스트와 질문 JSON 블록을 함께 포함할 수 있습니다.
5. 파일이 첨부된 경우, 파일 내용을 분석하여 관련 질문을 제안하세요.${existingQuestionsContext}`;

    // Build messages array
    const messages: Array<{ role: 'user' | 'assistant'; content: unknown }> = [];

    // Add conversation history
    if (dto.conversationHistory) {
      for (const msg of dto.conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Build current message content (potentially multimodal)
    const contentParts: unknown[] = [];

    // Add file attachments as base64 images
    if (dto.attachmentIds?.length) {
      for (const attachmentId of dto.attachmentIds) {
        const filePath = path.join(process.cwd(), 'uploads/ai-temp', attachmentId);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const base64 = fileBuffer.toString('base64');

          // Detect mime type from extension or default to image/png
          const ext = path.extname(attachmentId).toLowerCase();
          let mediaType = 'image/png';
          if (ext === '.jpg' || ext === '.jpeg') mediaType = 'image/jpeg';
          else if (ext === '.gif') mediaType = 'image/gif';
          else if (ext === '.webp') mediaType = 'image/webp';
          else if (ext === '.pdf') mediaType = 'application/pdf';

          if (mediaType === 'application/pdf') {
            contentParts.push({
              type: 'document',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            });
          } else {
            contentParts.push({
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            });
          }
        }
      }
    }

    contentParts.push({ type: 'text', text: dto.message });
    messages.push({ role: 'user', content: contentParts });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            const text = parsed.delta.text;
            fullText += text;

            // Check for questions block in accumulated text
            const questionsMatch = fullText.match(/<<<QUESTIONS>>>([\s\S]*?)<<<END_QUESTIONS>>>/);
            if (questionsMatch) {
              // Emit questions event
              try {
                const questions = JSON.parse(questionsMatch[1].trim());
                yield { type: 'questions', data: JSON.stringify(questions) };
              } catch {
                // JSON parse failed, emit as text
              }
              // Remove the questions block from what we send as text
              fullText = fullText.replace(/<<<QUESTIONS>>>[\s\S]*?<<<END_QUESTIONS>>>/, '');
            }

            // Only emit text that's not part of a questions block
            if (!text.includes('<<<QUESTIONS>>>') && !text.includes('<<<END_QUESTIONS>>>') && !fullText.includes('<<<QUESTIONS>>>')) {
              yield { type: 'text', data: text };
            }
          }
        } catch {
          // Skip unparseable lines
        }
      }
    }
  }

  private async *mockChatStream(dto: ChatMessageDto): AsyncGenerator<StreamEvent> {
    const response = `설문 질문을 생성해드리겠습니다. "${dto.message}"에 대한 질문입니다.`;
    const words = response.split('');

    for (const char of words) {
      yield { type: 'text', data: char };
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    // Generate mock questions
    const questions: TemplateQuestion[] = [
      {
        type: QuestionType.RADIO,
        title: `${dto.message}에 대한 전반적인 만족도를 선택해주세요.`,
        description: null,
        required: true,
        order: 0,
        options: {
          choices: [
            { id: 'c1', label: '매우 만족', value: 'very_satisfied', order: 0 },
            { id: 'c2', label: '만족', value: 'satisfied', order: 1 },
            { id: 'c3', label: '보통', value: 'neutral', order: 2 },
            { id: 'c4', label: '불만족', value: 'dissatisfied', order: 3 },
          ],
        },
        validation: { required: true },
      },
      {
        type: QuestionType.LONG_TEXT,
        title: '추가 의견이 있으시면 자유롭게 작성해주세요.',
        description: null,
        required: false,
        order: 1,
        options: { placeholder: '의견을 입력하세요', maxRows: 5 },
        validation: { required: false },
      },
    ];

    yield { type: 'questions', data: JSON.stringify(questions) };
  }

  async generateSurvey(dto: GenerateSurveyDto): Promise<AiGenerateResponse> {
    const count = dto.questionCount ?? 8;
    const language = dto.language ?? '한국어';

    if (this.apiKey) {
      try {
        return await this.callClaudeApi(dto, count, language);
      } catch (err) {
        this.logger.warn('AI API call failed, falling back to mock', err);
      }
    }

    return this.generateMock(dto, count, language);
  }

  private async callClaudeApi(
    dto: GenerateSurveyDto,
    count: number,
    language: string,
  ): Promise<AiGenerateResponse> {
    const systemPrompt = `You are a survey design expert. Generate a professional survey in JSON format.
The output must be valid JSON with this exact structure:
{
  "title": "survey title",
  "description": "survey description",
  "questions": [
    {
      "type": "radio|checkbox|short_text|long_text|dropdown|linear_scale|date|ranking",
      "title": "question text",
      "description": null,
      "required": true,
      "order": 0,
      "options": {},
      "validation": { "required": true }
    }
  ]
}

For radio/checkbox/dropdown questions, include choices in options:
"options": { "choices": [{ "id": "opt1", "label": "Option 1", "value": "opt1", "order": 0 }] }

For linear_scale questions:
"options": { "linearScale": { "min": 1, "max": 5, "minLabel": "Low", "maxLabel": "High", "step": 1 } }

Only output raw JSON, no markdown or explanation.`;

    const userPrompt = `Create a ${count}-question survey about "${dto.topic}"${dto.purpose ? ` for the purpose of "${dto.purpose}"` : ''}${dto.targetAudience ? ` targeting "${dto.targetAudience}"` : ''}.
Language: ${language}
Use a mix of question types (radio, checkbox, short_text, long_text, linear_scale, dropdown).
Make questions relevant and professional.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse AI response');

    const parsed = JSON.parse(jsonMatch[0]) as AiGenerateResponse;
    parsed.questions = parsed.questions.map((q, i) => ({
      ...q,
      order: i,
      validation: q.validation ?? { required: q.required ?? false },
      options: q.options ?? {},
    }));

    return parsed;
  }

  private generateMock(
    dto: GenerateSurveyDto,
    count: number,
    language: string,
  ): AiGenerateResponse {
    const isKorean = language.includes('한국') || language.toLowerCase().includes('korean');

    const title = isKorean
      ? `${dto.topic} 설문조사`
      : `${dto.topic} Survey`;
    const description = isKorean
      ? `${dto.topic}에 대한 의견을 수집하기 위한 설문입니다.${dto.purpose ? ` (목적: ${dto.purpose})` : ''}`
      : `A survey to gather opinions about ${dto.topic}.${dto.purpose ? ` (Purpose: ${dto.purpose})` : ''}`;

    const questions: TemplateQuestion[] = [];
    const templates = isKorean
      ? this.getKoreanTemplates(dto.topic)
      : this.getEnglishTemplates(dto.topic);

    for (let i = 0; i < Math.min(count, templates.length); i++) {
      questions.push({ ...templates[i], order: i });
    }

    return { title, description, questions };
  }

  private getKoreanTemplates(topic: string): TemplateQuestion[] {
    return [
      {
        type: QuestionType.RADIO,
        title: `${topic}에 대한 전반적인 만족도를 선택해주세요.`,
        description: null,
        required: true,
        order: 0,
        options: {
          choices: [
            { id: 'c1', label: '매우 만족', value: 'very_satisfied', order: 0 },
            { id: 'c2', label: '만족', value: 'satisfied', order: 1 },
            { id: 'c3', label: '보통', value: 'neutral', order: 2 },
            { id: 'c4', label: '불만족', value: 'dissatisfied', order: 3 },
            { id: 'c5', label: '매우 불만족', value: 'very_dissatisfied', order: 4 },
          ],
        },
        validation: { required: true },
      },
      {
        type: QuestionType.LINEAR_SCALE,
        title: `${topic}을(를) 다른 사람에게 추천할 의향이 있으신가요?`,
        description: '0점(전혀 추천하지 않음)부터 10점(매우 추천함)까지 선택해주세요.',
        required: true,
        order: 1,
        options: {
          linearScale: { min: 0, max: 10, minLabel: '전혀 추천하지 않음', maxLabel: '매우 추천함', step: 1 },
        },
        validation: { required: true },
      },
      {
        type: QuestionType.CHECKBOX,
        title: `${topic}에서 가장 좋았던 점을 모두 선택해주세요.`,
        description: null,
        required: true,
        order: 2,
        options: {
          choices: [
            { id: 'c1', label: '품질', value: 'quality', order: 0 },
            { id: 'c2', label: '가격', value: 'price', order: 1 },
            { id: 'c3', label: '서비스', value: 'service', order: 2 },
            { id: 'c4', label: '접근성', value: 'accessibility', order: 3 },
            { id: 'c5', label: '디자인', value: 'design', order: 4 },
          ],
        },
        validation: { required: true },
      },
      {
        type: QuestionType.DROPDOWN,
        title: `${topic}을(를) 어떻게 알게 되셨나요?`,
        description: null,
        required: true,
        order: 3,
        options: {
          choices: [
            { id: 'c1', label: '인터넷 검색', value: 'search', order: 0 },
            { id: 'c2', label: '소셜 미디어', value: 'social', order: 1 },
            { id: 'c3', label: '지인 추천', value: 'referral', order: 2 },
            { id: 'c4', label: '광고', value: 'ad', order: 3 },
            { id: 'c5', label: '기타', value: 'other', order: 4 },
          ],
        },
        validation: { required: true },
      },
      {
        type: QuestionType.LINEAR_SCALE,
        title: `${topic}의 품질에 대해 어떻게 평가하시나요?`,
        description: null,
        required: true,
        order: 4,
        options: {
          linearScale: { min: 1, max: 5, minLabel: '매우 나쁨', maxLabel: '매우 좋음', step: 1 },
        },
        validation: { required: true },
      },
      {
        type: QuestionType.RADIO,
        title: `${topic}을(를) 다시 이용/참여할 의향이 있으신가요?`,
        description: null,
        required: true,
        order: 5,
        options: {
          choices: [
            { id: 'c1', label: '반드시 그렇다', value: 'definitely', order: 0 },
            { id: 'c2', label: '아마 그럴 것이다', value: 'probably', order: 1 },
            { id: 'c3', label: '잘 모르겠다', value: 'unsure', order: 2 },
            { id: 'c4', label: '아마 아닐 것이다', value: 'probably_not', order: 3 },
            { id: 'c5', label: '절대 아니다', value: 'never', order: 4 },
          ],
        },
        validation: { required: true },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: `${topic}에서 개선되었으면 하는 점이 있다면 한 가지만 말씀해주세요.`,
        description: null,
        required: false,
        order: 6,
        options: { placeholder: '개선 사항을 입력해주세요' },
        validation: { required: false, maxLength: 200 },
      },
      {
        type: QuestionType.LONG_TEXT,
        title: `${topic}에 대한 추가 의견이나 제안이 있으시면 자유롭게 작성해주세요.`,
        description: null,
        required: false,
        order: 7,
        options: { placeholder: '자유롭게 의견을 남겨주세요', maxRows: 5 },
        validation: { required: false },
      },
      {
        type: QuestionType.DATE,
        title: `${topic}을(를) 마지막으로 이용/참여한 날짜를 선택해주세요.`,
        description: null,
        required: false,
        order: 8,
        options: {},
        validation: { required: false },
      },
      {
        type: QuestionType.RANKING,
        title: `다음 항목을 중요하다고 생각하는 순서대로 배열해주세요.`,
        description: null,
        required: true,
        order: 9,
        options: {
          choices: [
            { id: 'c1', label: '품질', value: 'quality', order: 0 },
            { id: 'c2', label: '가격', value: 'price', order: 1 },
            { id: 'c3', label: '서비스', value: 'service', order: 2 },
            { id: 'c4', label: '편의성', value: 'convenience', order: 3 },
          ],
        },
        validation: { required: true },
      },
    ];
  }

  private getEnglishTemplates(topic: string): TemplateQuestion[] {
    return [
      {
        type: QuestionType.RADIO,
        title: `How satisfied are you with ${topic} overall?`,
        description: null,
        required: true,
        order: 0,
        options: {
          choices: [
            { id: 'c1', label: 'Very Satisfied', value: 'very_satisfied', order: 0 },
            { id: 'c2', label: 'Satisfied', value: 'satisfied', order: 1 },
            { id: 'c3', label: 'Neutral', value: 'neutral', order: 2 },
            { id: 'c4', label: 'Dissatisfied', value: 'dissatisfied', order: 3 },
            { id: 'c5', label: 'Very Dissatisfied', value: 'very_dissatisfied', order: 4 },
          ],
        },
        validation: { required: true },
      },
      {
        type: QuestionType.LINEAR_SCALE,
        title: `How likely are you to recommend ${topic} to others?`,
        description: 'Select from 0 (Not at all likely) to 10 (Extremely likely)',
        required: true,
        order: 1,
        options: {
          linearScale: { min: 0, max: 10, minLabel: 'Not at all likely', maxLabel: 'Extremely likely', step: 1 },
        },
        validation: { required: true },
      },
      {
        type: QuestionType.CHECKBOX,
        title: `What aspects of ${topic} do you appreciate the most?`,
        description: 'Select all that apply',
        required: true,
        order: 2,
        options: {
          choices: [
            { id: 'c1', label: 'Quality', value: 'quality', order: 0 },
            { id: 'c2', label: 'Price', value: 'price', order: 1 },
            { id: 'c3', label: 'Service', value: 'service', order: 2 },
            { id: 'c4', label: 'Accessibility', value: 'accessibility', order: 3 },
            { id: 'c5', label: 'Design', value: 'design', order: 4 },
          ],
        },
        validation: { required: true },
      },
      {
        type: QuestionType.SHORT_TEXT,
        title: `What is one thing you would improve about ${topic}?`,
        description: null,
        required: false,
        order: 3,
        options: { placeholder: 'Enter your suggestion' },
        validation: { required: false, maxLength: 200 },
      },
      {
        type: QuestionType.LONG_TEXT,
        title: `Do you have any additional comments or suggestions about ${topic}?`,
        description: null,
        required: false,
        order: 4,
        options: { placeholder: 'Share your thoughts', maxRows: 5 },
        validation: { required: false },
      },
    ];
  }
}
