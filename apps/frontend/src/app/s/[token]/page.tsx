'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProgressBar } from '@/components/response/progress-bar';
import { QuestionInput } from '@/components/response/question-input';
import { publicApi } from '@/lib/public-api';
import type { PublicSurveyData, AnswerValue, QuestionType } from '@survey/shared';

type PageStatus = 'loading' | 'error' | 'ready' | 'answering' | 'submitting' | 'submitted';

export default function PublicSurveyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [status, setStatus] = useState<PageStatus>('loading');
  const [surveyData, setSurveyData] = useState<PublicSurveyData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, AnswerValue['value']>>(new Map());
  const [errorMessage, setErrorMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  const loadSurvey = useCallback(async () => {
    try {
      const data = await publicApi<PublicSurveyData>(`/public/surveys/${token}`);
      setSurveyData(data);

      // Initialize ranking answers with default order
      const initialAnswers = new Map<string, AnswerValue['value']>();
      for (const q of data.questions) {
        if (q.type === ('ranking' as QuestionType) && q.options.choices) {
          initialAnswers.set(q.id, q.options.choices.map((c) => c.value));
        }
      }
      setAnswers(initialAnswers);
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '설문을 불러올 수 없습니다.');
      setStatus('error');
    }
  }, [token]);

  useEffect(() => {
    loadSurvey();
  }, [loadSurvey]);

  const questions = surveyData?.questions ?? [];
  const currentQuestion = questions[currentIndex];

  const updateAnswer = (value: AnswerValue['value']) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(currentQuestion.id, value);
      return next;
    });
    setValidationError('');
  };

  const isAnswerEmpty = (val: AnswerValue['value']): boolean => {
    if (val === null || val === undefined || val === '') return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) return true;
    return false;
  };

  const handleNext = () => {
    if (currentQuestion.required && isAnswerEmpty(answers.get(currentQuestion.id) ?? null)) {
      setValidationError('이 질문은 필수입니다.');
      return;
    }
    setValidationError('');
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setValidationError('');
    setCurrentIndex((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (currentQuestion.required && isAnswerEmpty(answers.get(currentQuestion.id) ?? null)) {
      setValidationError('이 질문은 필수입니다.');
      return;
    }

    setStatus('submitting');
    try {
      const answersArray: AnswerValue[] = questions.map((q) => ({
        questionId: q.id,
        value: answers.get(q.id) ?? null,
      }));

      await publicApi(`/public/surveys/${token}/responses`, {
        method: 'POST',
        body: { answers: answersArray },
      });

      setStatus('submitted');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '제출에 실패했습니다.');
      setStatus('answering');
    }
  };

  // Loading
  if (status === 'loading') {
    return (
      <Card className="mt-8">
        <CardContent className="py-12 text-center text-muted-foreground">
          설문을 불러오는 중...
        </CardContent>
      </Card>
    );
  }

  // Error
  if (status === 'error') {
    return (
      <Card className="mt-8">
        <CardContent className="py-12 text-center">
          <p className="text-destructive font-medium">{errorMessage}</p>
          <p className="text-sm text-muted-foreground mt-2">
            링크가 올바른지 확인해주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Submitted
  if (status === 'submitted') {
    return (
      <Card className="mt-8">
        <CardContent className="py-12 text-center space-y-3">
          <div className="text-4xl">✓</div>
          <h2 className="text-xl font-bold">응답이 제출되었습니다</h2>
          <p className="text-muted-foreground">
            {surveyData?.config.completionMessage ||
              '설문에 참여해주셔서 감사합니다!'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Ready (intro)
  if (status === 'ready' && surveyData) {
    return (
      <Card className="mt-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{surveyData.survey.title}</CardTitle>
          {surveyData.survey.description && (
            <p className="text-muted-foreground mt-2">
              {surveyData.survey.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {surveyData.config.welcomeMessage && (
            <>
              <Separator />
              <p className="text-center text-sm text-muted-foreground">
                {surveyData.config.welcomeMessage}
              </p>
            </>
          )}
          <Separator />
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              총 {questions.length}개의 질문이 있습니다.
            </p>
            <Button
              size="lg"
              onClick={() => {
                setCurrentIndex(0);
                setStatus('answering');
              }}
            >
              시작하기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Answering
  if ((status === 'answering' || status === 'submitting') && currentQuestion) {
    const isLast = currentIndex === questions.length - 1;
    const isFirst = currentIndex === 0;

    return (
      <div className="mt-8 space-y-6">
        <ProgressBar current={currentIndex + 1} total={questions.length} />

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                질문 {currentIndex + 1}
              </p>
              <h3 className="text-lg font-medium">
                {currentQuestion.title}
                {currentQuestion.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </h3>
              {currentQuestion.description && (
                <p className="text-sm text-muted-foreground">
                  {currentQuestion.description}
                </p>
              )}
            </div>

            <Separator />

            <QuestionInput
              question={currentQuestion}
              value={answers.get(currentQuestion.id) ?? null}
              onChange={updateAnswer}
            />

            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}

            {errorMessage && status === 'answering' && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={isFirst || status === 'submitting'}
          >
            이전
          </Button>

          {isLast ? (
            <Button
              onClick={handleSubmit}
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? '제출 중...' : '제출'}
            </Button>
          ) : (
            <Button onClick={handleNext}>다음</Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
