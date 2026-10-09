import React from 'react';
import {
  MessageSquare,
  Plus,
  BookOpen,
  BarChart3,
  Trash2,
  Sparkles,
  ShieldAlert,
  GraduationCap,
  FileText,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { ConversationSummary, UserRole } from '../types';

interface SidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  activeTab: 'chat' | 'documents' | 'analytics';
  onTabChange: (tab: 'chat' | 'documents' | 'analytics') => void;
  role: UserRole;
  docCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  activeTab,
  onTabChange,
  role,
  docCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Action: New Conversation */}
        <div className="p-4 border-b border-slate-800/80">
          <button
            onClick={() => {
              onNewConversation();
              onTabChange('chat');
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>New Student Inquiry</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-3 pt-3 pb-2 space-y-1">
          <button
            onClick={() => {
              onTabChange('chat');
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'chat'
                ? 'bg-slate-800 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>Student Support Chat</span>
          </button>

          {role === 'admin' ? (
            <>
              <button
                onClick={() => {
                  onTabChange('documents');
                  if (isOpenMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-slate-800 text-amber-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Knowledge Base</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {docCount}
                </span>
              </button>

              <button
                onClick={() => {
                  onTabChange('analytics');
                  if (isOpenMobile) onCloseMobile();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Admin Analytics & Logs</span>
              </button>
            </>
          ) : (
            <div className="pt-2 px-3">
              <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-400 flex items-start space-x-2">
                <GraduationCap className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Ask questions about academic policies, emergency grants, dorms, parking & health services.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Recent Conversations</span>
            <span className="text-[10px] lowercase text-slate-400">{conversations.length} total</span>
          </div>

          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No saved conversations yet. Start an inquiry above!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversationId === conv.id && activeTab === 'chat';
              return (
                <div
                  key={conv.id}
                  className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onTabChange('chat');
                    if (isOpenMobile) onCloseMobile();
                  }}
                >
                  <div className="flex items-center space-x-2 overflow-hidden flex-1 mr-2">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-slate-300" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 p-1 rounded transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Preview Storage & Grounding notice */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="font-medium text-slate-300">Grounding RAG Active</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-tight">
            Answers verified against official campus regulations with citation grounding.
          </p>
        </div>
      </aside>
    </>
  );
};
