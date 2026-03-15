'use client';

import { cn } from '@/lib/utils';
import { FileText, Sparkles } from 'lucide-react';
import { QuestionInsertCard } from './question-insert-card';
import type { AiChatMessage } from '@survey/shared';

interface ChatMessageProps {
  message: AiChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="h-3.5 w-3.5 text-orange-600" />
        </div>
      )}

      <div className={cn('max-w-[85%] space-y-2')}>
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 text-xs bg-muted rounded-md px-2 py-1"
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="truncate max-w-[120px]">{att.filename}</span>
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <div
            className={cn(
              'rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap',
              isUser
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-muted rounded-bl-md',
            )}
          >
            {message.content}
          </div>
        )}

        {/* Generated questions */}
        {message.questions && message.questions.length > 0 && (
          <QuestionInsertCard questions={message.questions} />
        )}
      </div>
    </div>
  );
}
