import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  CornerDownLeft,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Conversation, ChatMessage, Citation } from '../types';
import { CampusApi } from '../services/api';

interface ChatViewProps {
  conversation: Conversation | null;
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  onOpenCitation: (citation: Citation) => void;
}

const SAMPLE_QUESTIONS = [
  {
    topic: 'Academic Regulations',
    query: 'How many times can I repeat a course for grade forgiveness?',
    badge: 'Academic',
    color: 'border-blue-200 bg-blue-50/60 text-blue-800 hover:bg-blue-100',
  },
  {
    topic: 'Financial Relief',
    query: 'What is the maximum emergency relief grant available and how do I apply?',
    badge: 'Financial Aid',
    color: 'border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100',
  },
  {
    topic: 'Dorm Policies',
    query: 'What are the quiet hours in university residence halls on weekends?',
    badge: 'Housing',
    color: 'border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100',
  },
  {
    topic: 'Mental Wellness',
    query: 'How many free individual therapy sessions can I get through CAPS?',
    badge: 'Health',
    color: 'border-purple-200 bg-purple-50/60 text-purple-800 hover:bg-purple-100',
  },
  {
    topic: 'Transportation',
    query: 'Can a commuter permit holder park in East Residential structure?',
    badge: 'Transit',
    color: 'border-slate-200 bg-slate-100/70 text-slate-800 hover:bg-slate-200',
  },
  {
    topic: 'Add/Drop Deadlines',
    query: 'When is the deadline to drop a class without receiving a W on my transcript?',
    badge: 'Registrar',
    color: 'border-cyan-200 bg-cyan-50/60 text-cyan-800 hover:bg-cyan-100',
  },
];

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onSendMessage,
  isLoading,
  onOpenCitation,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, 'helpful' | 'unhelpful'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (messageId: string, feedback: 'helpful' | 'unhelpful') => {
    if (!conversation) return;
    setFeedbackStatus((prev) => ({ ...prev, [messageId]: feedback }));
    try {
      await CampusApi.sendFeedback(conversation.id, messageId, feedback);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  // Helper to format assistant messages with bold text, bullet points, and citation tags
  const renderFormattedContent = (content: string, citations?: Citation[]) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed text-slate-800">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Headers
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-sm mt-3 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ') || line.startsWith('# ')) {
            return (
              <h3 key={idx} className="font-bold text-slate-900 text-base mt-3 mb-1">
                {line.replace(/^#+\s/, '')}
              </h3>
            );
          }

          // Bullet points
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const bulletText = line.trim().replace(/^[-*]\s/, '');
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                <span>{renderTextWithCitations(bulletText, citations)}</span>
              </div>
            );
          }

          // Numbered lists
          const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="font-semibold text-blue-700 shrink-0 text-xs mt-0.5">
                  {numMatch[1]}.
                </span>
                <span>{renderTextWithCitations(numMatch[2], citations)}</span>
              </div>
            );
          }

          return <p key={idx}>{renderTextWithCitations(line, citations)}</p>;
        })}
      </div>
    );
  };

  // Replace [Doc: ... Section: ...] with clickable citation chips
  const renderTextWithCitations = (text: string, citations?: Citation[]) => {
    // Look for markdown bold **text** or citations
    const parts = text.split(/(\[[^\]]+\]|\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      // Citation pattern
      if (part.startsWith('[Doc:') || part.startsWith('[Doc ') || (part.startsWith('[') && part.includes('Section:'))) {
        const cleanLabel = part.replace(/^\[/, '').replace(/\]$/, '');
        // Find matching citation object if possible
        const matched = citations?.find(
          (c) =>
            cleanLabel.toLowerCase().includes(c.docTitle.toLowerCase()) ||
            cleanLabel.toLowerCase().includes(c.sectionTitle.toLowerCase())
        );

        return (
          <button
            key={index}
            onClick={() => {
              if (matched) {
                onOpenCitation(matched);
              } else if (citations && citations.length > 0) {
                onOpenCitation(citations[0]);
              }
            }}
            className="inline-flex items-center space-x-1 mx-1 px-2 py-0.5 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 font-semibold text-xs transition-colors cursor-pointer"
            title="Click to view verified source excerpt"
          >
            <BookOpen className="w-3 h-3 text-blue-700 inline mr-1" />
            <span>{cleanLabel}</span>
          </button>
        );
      }

      // Bold text
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }

      return <span key={index}>{part}</span>;
    });
  };

  const messages = conversation?.messages || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Top Banner with University Identity */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-600">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-800">
            {conversation?.title || 'New Student Inquiry'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline text-slate-600 text-[11px]">Strict Grounding Enabled:</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium text-[11px]">
            <Check className="w-3 h-3 mr-1 text-emerald-700" />
            Official Policies Only
          </span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty State: Quick Prompt Suggestions */
          <div className="max-w-2xl mx-auto my-auto py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 mb-4 border border-blue-400">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              CampusQuery AI Assistant
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
              Get immediate, official answers to university policies, academic deadlines, emergency grants, housing guidelines, and health services—with direct source citations.
            </p>

            {/* Prompt Suggestion Cards */}
            <div className="mt-8 text-left">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 text-center sm:text-left">
                Common Student Inquiries (Demonstration Knowledge Base)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SAMPLE_QUESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.query)}
                    className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between ${item.color}`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 shadow-xs">
                        {item.badge}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                    </div>
                    <p className="text-xs font-semibold leading-snug">{item.query}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message List */
          messages.map((message) => {
            const isUser = message.role === 'user';
            const currentFeedback = feedbackStatus[message.id] || message.feedback;

            return (
              <div
                key={message.id}
                className={`flex items-start space-x-3 max-w-3xl ${
                  isUser ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-white border border-slate-700'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <GraduationCap className="w-4 h-4 text-blue-400" />}
                </div>

                {/* Message Bubble Container */}
                <div className={`space-y-2 flex-1 max-w-2xl`}>
                  <div
                    className={`p-4 rounded-2xl shadow-xs transition-all ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none ml-auto'
                        : 'bg-white border border-slate-200/90 rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <>
                        {/* Fallback Notice if query couldn't be answered from docs */}
                        {message.isFallback && (
                          <div className="mb-3 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start space-x-2.5 text-xs text-amber-900">
                            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-semibold block text-amber-950">
                                Official Policy Boundary Notice
                              </strong>
                              This topic is not addressed in current campus handbooks. To prevent misinformation, the assistant will not speculate.
                            </div>
                          </div>
                        )}

                        {/* Assistant formatted text */}
                        {renderFormattedContent(message.content, message.citations)}

                        {/* Grounded Citation Chips section */}
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
                              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                              <span>Verified Source Citations ({message.citations.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {message.citations.map((cite, cIdx) => (
                                <button
                                  key={cIdx}
                                  onClick={() => onOpenCitation(cite)}
                                  className="text-left px-2.5 py-1 rounded-lg bg-blue-50/80 hover:bg-blue-100 text-blue-900 border border-blue-200/80 text-xs transition-colors flex items-center space-x-1.5 group"
                                >
                                  <span className="font-semibold">{cite.docTitle}</span>
                                  <span className="text-blue-500 text-[11px] font-medium">({cite.sectionTitle})</span>
                                  <ExternalLink className="w-3 h-3 text-blue-400 group-hover:text-blue-700" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions Bar for Assistant message */}
                  {!isUser && (
                    <div className="flex items-center space-x-2 px-1 text-xs text-slate-600">
                      <button
                        onClick={() => handleCopy(message.content, message.id)}
                        className="flex items-center space-x-1 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-200/60 transition-colors"
                        title="Copy answer"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <div className="h-3 w-px bg-slate-300" />

                      {/* Helpful Thumbs */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleFeedback(message.id, 'helpful')}
                          className={`p-1 rounded-md transition-colors ${
                            currentFeedback === 'helpful'
                              ? 'text-emerald-600 bg-emerald-50'
                              : 'hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                          title="This was helpful"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'unhelpful')}
                          className={`p-1 rounded-md transition-colors ${
                            currentFeedback === 'unhelpful'
                              ? 'text-rose-600 bg-rose-50'
                              : 'hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                          title="This was not helpful"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-600 ml-auto">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3 max-w-xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 border border-slate-700">
              <GraduationCap className="w-4 h-4 text-blue-400" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-blue-700">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Searching official campus documents & synthesizing citations...</span>
              </div>
              <div className="h-2 w-48 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="bg-white border-t border-slate-200 p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <div className="relative rounded-2xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-xs bg-white transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask about academic policies, emergency grants, dorm quiet hours, campus parking..."
              disabled={isLoading}
              className="w-full pl-4 pr-14 py-3 text-sm text-slate-900 placeholder-slate-400 bg-transparent resize-none focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2.5 bottom-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-all shadow-xs"
              title="Send Inquiry"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-600">
            <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for newline</span>
            <span>Grounded in verified campus regulations</span>
          </div>
        </form>
      </div>
    </div>
  );
};
