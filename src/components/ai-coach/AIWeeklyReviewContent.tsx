'use client';

import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Target, Lightbulb, Brain, Loader2, AlertCircle, MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';

export function AIWeeklyReviewContent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="flex space-x-3">
            {m.role === 'user' ? (
              <div className="text-sm p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-medium text-blue-900">You: </span>
                <span className="text-blue-800">{m.content}</span>
              </div>
            ) : (
              <div className="text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="font-medium text-gray-900">AI Coach: </span>
                <span className="text-gray-800">{m.content}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          placeholder="Ask about your weekly review..."
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={!input.trim() || isLoading} size="sm">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">{error.message}</span>
        </div>
      )}
    </div>
  );
}
