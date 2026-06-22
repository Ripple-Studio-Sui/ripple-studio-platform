'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useCoachContext } from '@/lib/ai/coach-context';
import { streamChat } from '@/lib/ai';
import type { AiMessage, ChatStreamEvent } from '@ripple-studio/shared';
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const SUGGESTIONS = [
  'How do I set up trait rarity?',
  'What is Walrus storage?',
  'Walk me through the launch checklist',
];

export function CoachSidebar() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { collectionId } = useCoachContext();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hidden = pathname === '/login' || pathname === '/' || !isAuthenticated || isLoading;

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamBuffer, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      setError(null);
      setStreaming(true);
      setStreamBuffer('');

      const userMsg: AiMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');

      let assistantText = '';

      try {
        await streamChat(
          { message: trimmed, sessionId, collectionId },
          (event: ChatStreamEvent) => {
            if (event.type === 'session') {
              setSessionId(event.sessionId);
            } else if (event.type === 'token') {
              assistantText += event.content;
              setStreamBuffer(assistantText);
            } else if (event.type === 'error') {
              setError(event.message);
            } else if (event.type === 'done') {
              setMessages((prev) => [
                ...prev,
                {
                  id: event.messageId,
                  role: 'assistant',
                  content: assistantText,
                  createdAt: new Date().toISOString(),
                },
              ]);
              setStreamBuffer('');
            }
          },
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setStreamBuffer('');
      } finally {
        setStreaming(false);
      }
    },
    [streaming, sessionId, collectionId],
  );

  if (hidden) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-ripple-500 hover:bg-ripple-400 text-white px-4 py-3 rounded-full shadow-lg shadow-ripple-900/50 transition-all hover:scale-105"
          aria-label="Open Creator Coach"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Creator Coach</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-full max-w-md bg-ripple-950 border-l border-ripple-700/50 flex flex-col shadow-2xl">
            <header className="flex items-center justify-between px-4 py-3 border-b border-ripple-700/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-ripple-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-ripple-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Creator Coach</p>
                  <p className="text-xs text-ripple-400 capitalize">
                    {user?.experienceMode ?? 'beginner'} mode
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-ripple-400 hover:text-ripple-200 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !streamBuffer && (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 text-ripple-500 mx-auto mb-3" />
                  <p className="text-ripple-300 text-sm mb-4">
                    Ask me anything about Sui NFTs, Walrus, traits, or your collection workflow.
                  </p>
                  <div className="space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        disabled={streaming}
                        className="block w-full text-left text-xs text-ripple-400 hover:text-ripple-200 bg-ripple-900/40 border border-ripple-700/40 rounded-lg px-3 py-2 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-ripple-500 text-white rounded-br-md'
                        : 'bg-ripple-900/60 border border-ripple-700/40 text-ripple-100 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {streamBuffer && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm bg-ripple-900/60 border border-ripple-700/40 text-ripple-100">
                    <p className="whitespace-pre-wrap">{streamBuffer}</p>
                  </div>
                </div>
              )}

              {streaming && !streamBuffer && (
                <div className="flex justify-start">
                  <div className="bg-ripple-900/60 border border-ripple-700/40 rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-ripple-400" />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2 text-xs text-red-200">
                  {error}
                </div>
              )}
            </div>

            <footer className="p-4 border-t border-ripple-700/50">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask the Creator Coach…"
                  rows={2}
                  disabled={streaming}
                  className="flex-1 resize-none bg-ripple-900/60 border border-ripple-700/50 rounded-xl px-3 py-2 text-sm text-white placeholder:text-ripple-500 focus:outline-none focus:border-ripple-400 disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={streaming || !input.trim()}
                  className="bg-ripple-500 hover:bg-ripple-400 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors"
                  aria-label="Send"
                >
                  {streaming ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              {sessionId && (
                <button
                  onClick={() => {
                    setSessionId(undefined);
                    setMessages([]);
                    setStreamBuffer('');
                    setError(null);
                  }}
                  className="text-xs text-ripple-500 hover:text-ripple-300 mt-2"
                >
                  New conversation
                </button>
              )}
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}