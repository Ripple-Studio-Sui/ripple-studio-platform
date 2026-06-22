'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useCoachContext } from '@/lib/ai/coach-context';
import { listAgents, streamChat } from '@/lib/ai';
import { getMemoryStatus, syncMemory } from '@/lib/memory';
import type { AgentInfo, AiAgentType, MemoryStatus } from '@ripple-studio/shared';
import type { AiMessage, ChatStreamEvent } from '@ripple-studio/shared';
import { Bot, ChevronDown, Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type AgentSelection = AiAgentType | 'auto';

type ChatMessage = AiMessage & {
  agentType?: AiAgentType;
  agentName?: string;
};

const SUGGESTIONS: Record<AgentSelection, string[]> = {
  auto: [
    'How do I set up trait rarity?',
    'What is Walrus storage?',
    'Walk me through the launch checklist',
  ],
  creator_coach: [
    'What should I do after generating my NFTs?',
    'Explain the Ripple Studio workflow',
    'Tips for a first-time Sui creator',
  ],
  nft_architect: [
    'How should I structure my trait layers?',
    'Help me design rarity weights',
    'Suggest a lore theme for my collection',
  ],
  metadata: [
    'What fields does the Sui Display schema need?',
    'How do I export metadata as a ZIP?',
    'Explain trait_type vs value in metadata',
  ],
  marketplace: [
    'When should I list on TradePort?',
    'How do I price my collection at launch?',
    'What is a good floor strategy?',
  ],
  deployment: [
    'Walk me through testnet deployment',
    'What Move packages do I need to publish?',
    'How does the mint cap work on Sui?',
  ],
  support: [
    'My generation job is stuck — what should I check?',
    'Walrus upload failed — how do I troubleshoot?',
    'Why is my metadata job not completing?',
  ],
};

export function CoachSidebar() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { collectionId } = useCoachContext();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [memoryStatus, setMemoryStatus] = useState<MemoryStatus | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentSelection>('auto');
  const [activeAgent, setActiveAgent] = useState<{ type: AiAgentType; name: string } | null>(
    null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const hidden = pathname === '/login' || pathname === '/' || !isAuthenticated || isLoading;

  const suggestions = SUGGESTIONS[selectedAgent];

  const headerLabel =
    selectedAgent === 'auto'
      ? activeAgent?.name ?? 'AI Assistant'
      : agents.find((a) => a.type === selectedAgent)?.name ?? 'AI Assistant';

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamBuffer, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listAgents()
      .then(setAgents)
      .catch(() => {});
    getMemoryStatus()
      .then(setMemoryStatus)
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      setError(null);
      setStreaming(true);
      setStreamBuffer('');
      setActiveAgent(null);

      const userMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');

      let assistantText = '';
      let routedAgent: { type: AiAgentType; name: string } | null = null;

      try {
        await streamChat(
          {
            message: trimmed,
            sessionId,
            collectionId,
            agentType: selectedAgent,
          },
          (event: ChatStreamEvent) => {
            if (event.type === 'session') {
              setSessionId(event.sessionId);
            } else if (event.type === 'agent') {
              routedAgent = { type: event.agentType, name: event.agentName };
              setActiveAgent(routedAgent);
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
                  agentType: routedAgent?.type,
                  agentName: routedAgent?.name,
                },
              ]);
              setStreamBuffer('');
            }
          },
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setStreamBuffer('');
        setActiveAgent(null);
      } finally {
        setStreaming(false);
      }
    },
    [streaming, sessionId, collectionId, selectedAgent],
  );

  if (hidden) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-ripple-500 hover:bg-ripple-400 text-white px-4 py-3 rounded-full shadow-lg shadow-ripple-900/50 transition-all hover:scale-105"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">AI Assistant</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-full max-w-md bg-ripple-950 border-l border-ripple-700/50 flex flex-col shadow-2xl">
            <header className="px-4 py-3 border-b border-ripple-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-ripple-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-ripple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{headerLabel}</p>
                    <p className="text-xs text-ripple-400 capitalize truncate">
                      {user?.experienceMode ?? 'beginner'} mode
                      {selectedAgent === 'auto' && activeAgent && (
                        <span className="text-ripple-300"> · routed</span>
                      )}
                      {memoryStatus && (
                        <span className="text-emerald-400/80">
                          {' '}
                          · {memoryStatus.primary} memory
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-ripple-400 hover:text-ripple-200 p-1 shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div ref={pickerRef} className="relative">
                <button
                  onClick={() => setPickerOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 text-xs bg-ripple-900/60 border border-ripple-700/50 rounded-lg px-3 py-2 text-ripple-200 hover:border-ripple-500/60 transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={pickerOpen}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Bot className="w-3.5 h-3.5 text-ripple-400 shrink-0" />
                    {selectedAgent === 'auto'
                      ? 'Auto — route by intent'
                      : (agents.find((a) => a.type === selectedAgent)?.name ?? selectedAgent)}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-ripple-400 shrink-0 transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {pickerOpen && (
                  <div
                    role="listbox"
                    className="absolute left-0 right-0 top-full mt-1 z-10 bg-ripple-900 border border-ripple-700/60 rounded-lg shadow-xl max-h-56 overflow-y-auto"
                  >
                    <button
                      role="option"
                      aria-selected={selectedAgent === 'auto'}
                      onClick={() => {
                        setSelectedAgent('auto');
                        setPickerOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-ripple-800/80 transition-colors ${
                        selectedAgent === 'auto' ? 'bg-ripple-800/60 text-ripple-100' : 'text-ripple-300'
                      }`}
                    >
                      <p className="font-medium">Auto — route by intent</p>
                      <p className="text-ripple-500 mt-0.5">Picks the best specialist per message</p>
                    </button>
                    {agents.map((agent) => (
                      <button
                        key={agent.type}
                        role="option"
                        aria-selected={selectedAgent === agent.type}
                        onClick={() => {
                          setSelectedAgent(agent.type);
                          setPickerOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-ripple-800/80 transition-colors border-t border-ripple-700/30 ${
                          selectedAgent === agent.type
                            ? 'bg-ripple-800/60 text-ripple-100'
                            : 'text-ripple-300'
                        }`}
                      >
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-ripple-500 mt-0.5">{agent.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !streamBuffer && (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 text-ripple-500 mx-auto mb-3" />
                  <p className="text-ripple-300 text-sm mb-4">
                    {selectedAgent === 'auto'
                      ? 'Ask anything — we route you to the right specialist (traits, metadata, marketplace, deploy, or support).'
                      : (agents.find((a) => a.type === selectedAgent)?.description ??
                        'Ask me anything about your NFT collection workflow.')}
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((s) => (
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
                    {msg.role === 'assistant' && msg.agentName && (
                      <p className="text-[10px] uppercase tracking-wide text-ripple-400 mb-1.5 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        {msg.agentName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {streamBuffer && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm bg-ripple-900/60 border border-ripple-700/40 text-ripple-100">
                    {activeAgent && (
                      <p className="text-[10px] uppercase tracking-wide text-ripple-400 mb-1.5 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        {activeAgent.name}
                      </p>
                    )}
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
                  placeholder={
                    selectedAgent === 'auto'
                      ? 'Ask anything…'
                      : `Ask ${agents.find((a) => a.type === selectedAgent)?.name ?? 'the agent'}…`
                  }
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
              <div className="flex gap-3 mt-2">
                {sessionId && (
                  <button
                    onClick={() => {
                      setSessionId(undefined);
                      setMessages([]);
                      setStreamBuffer('');
                      setError(null);
                      setActiveAgent(null);
                    }}
                    className="text-xs text-ripple-500 hover:text-ripple-300"
                  >
                    New conversation
                  </button>
                )}
                <button
                  onClick={() => syncMemory().catch(() => {})}
                  className="text-xs text-ripple-500 hover:text-ripple-300"
                >
                  Sync memory
                </button>
              </div>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}