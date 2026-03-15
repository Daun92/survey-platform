import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuestionType } from '@survey/shared';
import type { AiGenerateResponse, TemplateQuestion } from '@survey/shared';
import { GenerateSurveyDto } from './dto/generate-survey.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
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
    // Ensure order fields are set
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
