'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, Trash2, Save, GripVertical } from 'lucide-react';
import type {
  AiGenerateResponse,
  TemplateQuestion,
  ProjectResponse,
} from '@survey/shared';

const TYPE_LABELS: Record<string, string> = {
  short_text: '단답형',
  long_text: '장문형',
  radio: '객관식',
  checkbox: '체크박스',
  dropdown: '드롭다운',
  linear_scale: '선형 척도',
  date: '날짜',
  matrix: '매트릭스',
  ranking: '순위',
};

export default function AiGeneratePage() {
  const router = useRouter();

  // Form state
  const [topic, setTopic] = useState('');
  const [purpose, setPurpose] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [questionCount, setQuestionCount] = useState(8);
  const [generating, setGenerating] = useState(false);

  // Result state
  const [result, setResult] = useState<AiGenerateResponse | null>(null);
  const [editedQuestions, setEditedQuestions] = useState<TemplateQuestion[]>([]);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  // Save dialog
  const [saveOpen, setSaveOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const data = await api<AiGenerateResponse>('/ai/generate-survey', {
        method: 'POST',
        body: JSON.stringify({
          topic: topic.trim(),
          purpose: purpose.trim() || undefined,
          targetAudience: targetAudience.trim() || undefined,
          questionCount,
        }),
      });
      setResult(data);
      setEditedTitle(data.title);
      setEditedDescription(data.description);
      setEditedQuestions([...data.questions]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'AI 생성 실패');
    } finally {
      setGenerating(false);
    }
  };

  const removeQuestion = (index: number) => {
    setEditedQuestions((q) => q.filter((_, i) => i !== index));
  };

  const updateQuestionTitle = (index: number, title: string) => {
    setEditedQuestions((q) =>
      q.map((item, i) => (i === index ? { ...item, title } : item)),
    );
  };

  const handleOpenSave = async () => {
    try {
      const data = await api<ProjectResponse[]>('/projects');
      setProjects(data);
    } catch {
      // ignore
    }
    setSelectedProjectId('');
    setSaveOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProjectId) return;
    setSaving(true);
    try {
      // Create survey
      const survey = await api<{ id: string }>('/surveys', {
        method: 'POST',
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: editedTitle,
          description: editedDescription,
        }),
      });

      // Create questions
      const questionsPayload = editedQuestions.map((q, i) => ({
        type: q.type,
        title: q.title,
        description: q.description,
        required: q.required,
        order: i,
        options: q.options,
        validation: q.validation,
      }));

      await api(`/surveys/${survey.id}/questions/bulk`, {
        method: 'POST',
        body: JSON.stringify(questionsPayload),
      });

      router.push(`/dashboard/surveys/${survey.id}/edit`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 실패');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-orange-500" />
          AI 설문 생성
        </h1>
        <p className="text-muted-foreground">
          주제와 목적을 입력하면 AI가 맞춤형 설문을 생성합니다.
        </p>
      </div>

      {/* Input Form */}
      {!result && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>주제 *</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예: 사내 복지 만족도, 신제품 사용자 경험"
              />
            </div>
            <div className="space-y-2">
              <Label>목적 (선택)</Label>
              <Textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="예: 직원들의 복지 프로그램에 대한 만족도를 파악하고 개선점을 도출"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>대상 (선택)</Label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="예: 전체 직원, 20대 고객"
                />
              </div>
              <div className="space-y-2">
                <Label>질문 수</Label>
                <Select
                  value={String(questionCount)}
                  onValueChange={(v) => setQuestionCount(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 8, 10, 15, 20].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}개
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!topic.trim() || generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI가 설문을 생성하고 있습니다...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI로 설문 생성하기
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <>
          {/* Title & Description */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="space-y-2">
                <Label>설문 제목</Label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>설문 설명</Label>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                생성된 질문 ({editedQuestions.length}개)
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setResult(null); setEditedQuestions([]); }}>
                  다시 생성
                </Button>
                <Button onClick={handleOpenSave}>
                  <Save className="h-4 w-4 mr-1" />
                  설문으로 저장
                </Button>
              </div>
            </div>

            {editedQuestions.map((q, i) => (
              <Card key={i}>
                <CardHeader className="pb-2 flex flex-row items-start gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Q{i + 1}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[q.type] ?? q.type}
                      </Badge>
                      {q.required && (
                        <Badge variant="secondary" className="text-xs">
                          필수
                        </Badge>
                      )}
                    </div>
                    <Input
                      value={q.title}
                      onChange={(e) => updateQuestionTitle(i, e.target.value)}
                      className="font-medium"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive shrink-0"
                    onClick={() => removeQuestion(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                {q.options?.choices && (
                  <CardContent className="pt-0 pl-12">
                    <div className="space-y-1">
                      {q.options.choices.map((choice, ci) => (
                        <div
                          key={ci}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <span className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />
                          {choice.label}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
                {q.options?.linearScale && (
                  <CardContent className="pt-0 pl-12">
                    <p className="text-sm text-muted-foreground">
                      {q.options.linearScale.min} ({q.options.linearScale.minLabel ?? ''}) ~{' '}
                      {q.options.linearScale.max} ({q.options.linearScale.maxLabel ?? ''})
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Save Dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>설문으로 저장</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              프로젝트를 선택하면 AI가 생성한 설문이 DRAFT 상태로 저장됩니다.
            </p>
            <div className="space-y-2">
              <Label>프로젝트</Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              disabled={!selectedProjectId || saving}
              onClick={handleSave}
            >
              {saving ? '저장 중...' : '설문 저장 및 편집'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
