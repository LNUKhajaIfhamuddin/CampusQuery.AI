import React from 'react';
import {
  GraduationCap,
  Shield,
  User,
  Info,
  Menu,
  Sparkles,
  Server,
  BookOpen
} from 'lucide-react';
import { UserRole, SystemStatus } from '../types';

interface HeaderProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  systemStatus: SystemStatus | null;
  onOpenSystemNotice: () => void;
  onToggleMobileSidebar: () => void;
  activeTab: 'chat' | 'documents' | 'analytics';
  onTabChange: (tab: 'chat' | 'documents' | 'analytics') => void;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  onRoleChange,
  systemStatus,
  onOpenSystemNotice,
  onToggleMobileSidebar,
  activeTab,
  onTabChange,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 border border-blue-400/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-tight text-white">CampusQuery</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-blue-500/20 text-blue-300 rounded border border-blue-400/30">
                    AI
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Verified University Student Support & Knowledge Assistant
                </p>
              </div>
            </div>
          </div>

          {/* Center Tabs (Desktop for quick switching) */}
          <div className="hidden lg:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => onTabChange('chat')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Student Chat
            </button>

            {role === 'admin' && (
              <>
                <button
                  onClick={() => onTabChange('documents')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeTab === 'documents'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Knowledge Base
                </button>
                <button
                  onClick={() => onTabChange('analytics')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Admin Analytics
                </button>
              </>
            )}
          </div>

          {/* Right: Role Switcher & System Info */}
          <div className="flex items-center space-x-3">
            {/* System Status Button */}
            <button
              onClick={onOpenSystemNotice}
              title="System Architecture & Storage Info"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">RAG Online</span>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-700/80">
              <button
                onClick={() => {
                  onRoleChange('student');
                  onTabChange('chat');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  role === 'student'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>

              <button
                onClick={() => {
                  onRoleChange('admin');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  role === 'admin'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
