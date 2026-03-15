'use client';

import { useState, useCallback } from 'react';
import { apiUpload, apiStream } from '@/lib/api';
import type { AiChatAttachment, AiChatMessage, TemplateQuestion } from '@survey/shared';

export function useAiChat(surveyId: string) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<AiChatAttachment[]>([]);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const result = await apiUpload<AiChatAttachment>('/ai/upload', formData);
    setPendingAttachments((prev) => [...prev, result]);
    return result;
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      existingQuestions: Array<{ type: string; title: string }>,
      onQuestionsGenerated?: (questions: TemplateQuestion[]) => void,
    ) => {
      if (!content.trim() && pendingAttachments.length === 0) return;

      const userMessage: AiChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      const currentAttachments = [...pendingAttachments];
      setPendingAttachments([]);
      setIsStreaming(true);

      const assistantId = crypto.randomUUID();
      const assistantMessage: AiChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Build conversation history from previous messages
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        await apiStream(
          '/ai/chat',
          {
            message: content,
            surveyId,
            attachmentIds: currentAttachments.map((a) => a.id),
            conversationHistory,
            existingQuestions,
          },
          (event) => {
            if (event.type === 'text' && event.data) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.data }
                    : m,
                ),
              );
            } else if (event.type === 'questions' && event.data) {
              try {
                const questions = JSON.parse(event.data) as TemplateQuestion[];
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, questions } : m,
                  ),
                );
                onQuestionsGenerated?.(questions);
              } catch {
                // ignore parse errors
              }
            } else if (event.type === 'error' && event.data) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + `\n\n오류: ${event.data}` }
                    : m,
                ),
              );
            }
          },
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}` }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [surveyId, messages, pendingAttachments],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setPendingAttachments([]);
  }, []);

  return {
    messages,
    isStreaming,
    pendingAttachments,
    uploadFile,
    removeAttachment,
    sendMessage,
    clearChat,
  };
}
