import React from 'react';
import {
  X,
  ShieldCheck,
  Server,
  Sparkles,
  Database,
  Lock,
  CheckCircle,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';
import { SystemStatus } from '../types';

interface SystemNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatus | null;
}

export const SystemNoticeModal: React.FC<SystemNoticeModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  System Architecture
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                CampusQuery AI Architecture & Storage Notice
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          {/* Key Pill Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">AI Engine</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">Gemini 3.8 Flash</p>
              <p className="text-[11px] text-slate-500">Server-Side @google/genai SDK</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Backend API</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">Node.js Express</p>
              <p className="text-[11px] text-slate-500">Real server-side RAG endpoints</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Grounding Mode</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">Strict RAG Citations</p>
              <p className="text-[11px] text-slate-500">Zero unsupported speculation</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Storage Mode</span>
              <p className="font-bold text-amber-700 text-sm mt-0.5">Disk & Memory Cache</p>
              <p className="text-[11px] text-slate-500">Development Preview runtime</p>
            </div>
          </div>

          {/* Explicit Disclosure on Storage and Authentication Limits */}
          <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Durable Storage & Authentication Transparency</span>
            </div>
            <p className="text-amber-950 text-xs leading-relaxed">
              In this Google AI Studio Build development environment, conversations and documents are persisted to the server's local disk cache (<code className="bg-amber-100/70 px-1 rounded font-mono">data/campusquery-db.json</code>).
            </p>
            <p className="text-amber-950 text-xs leading-relaxed">
              Enterprise university deployments require institutional relational databases (e.g., Cloud SQL PostgreSQL or Cloud Firestore) and SSO authentication (SAML / CAS / Shibboleth). In this preview, role authorization is verified via genuine server-side HTTP headers.
            </p>
          </div>

          {/* Genuine Backend Verification */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Genuine Server-Side Execution</span>
            </div>
            <ul className="space-y-1.5 text-blue-950 text-xs list-disc pl-4">
              <li>The Gemini API key is never exposed to the client or browser bundle.</li>
              <li>Document chunking and TF-IDF scoring execute server-side before prompting Gemini.</li>
              <li>All chat messages, feedback, and telemetry logs are processed by real Express API endpoints.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
