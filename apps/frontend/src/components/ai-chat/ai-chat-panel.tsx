'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Trash2 } from 'lucide-react';
import { useAiChat } from '@/hooks/use-ai-chat';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { useEffect, useRef } from 'react';
import type { QuestionResponse, TemplateQuestion } from '@survey/shared';

interface AiChatPanelProps {
  surveyId: string;
  existingQuestions: QuestionResponse[];
  onQuestionsGenerated: (questions: TemplateQuestion[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiChatPanel({
  surveyId,
  existingQuestions,
  onQuestionsGenerated,
  open,
  onOpenChange,
}: AiChatPanelProps) {
  const {
    messages,
    isStreaming,
    pendingAttachments,
    uploadFile,
    removeAttachment,
    sendMessage,
    clearChat,
  } = useAiChat(surveyId);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (content: string) => {
    const existingQs = existingQuestions.map((q) => ({
      type: q.type,
      title: q.title,
    }));
    sendMessage(content, existingQs, onQuestionsGenerated);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <SheetTitle className="text-base">AI 어시스턴트</SheetTitle>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </SheetHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Sparkles className="h-10 w-10 text-orange-500/30 mb-4" />
              <h3 className="font-medium mb-1">AI 설문 어시스턴트</h3>
              <p className="text-sm text-muted-foreground">
                설문 주제, 대상, 목적을 알려주시면 맞춤형 질문을 생성해드립니다.
                PDF나 이미지를 첨부하면 내용을 분석하여 질문을 제안합니다.
              </p>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p>&quot;직원 만족도 설문 5문항 만들어줘&quot;</p>
                <p>&quot;고객 피드백 조사 질문을 추천해줘&quot;</p>
                <p>&quot;이 PDF 기반으로 설문 만들어줘&quot;</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isStreaming && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="animate-bounce delay-0">·</span>
                    <span className="animate-bounce delay-100">·</span>
                    <span className="animate-bounce delay-200">·</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onFileUpload={uploadFile}
          pendingAttachments={pendingAttachments}
          onRemoveAttachment={removeAttachment}
          isStreaming={isStreaming}
        />
      </SheetContent>
    </Sheet>
  );
}
