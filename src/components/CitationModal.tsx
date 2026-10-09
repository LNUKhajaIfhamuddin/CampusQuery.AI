import React from 'react';
import { X, BookOpen, ExternalLink, CheckCircle, ShieldCheck } from 'lucide-react';
import { Citation } from '../types';

interface CitationModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/90 text-white flex items-center justify-center border border-blue-400/40 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Verified Source Grounding
                </span>
                <span className="inline-flex items-center text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Official Policy
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 leading-snug">
                {citation.docTitle}
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
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Section badge */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Document Section
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
              {citation.sectionTitle}
            </div>
          </div>

          {/* Passage excerpt */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Indexed Excerpt Provided to Model
            </div>
            <div className="mt-1.5 p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-slate-800 text-sm leading-relaxed font-sans whitespace-pre-line">
              "{citation.excerpt}"
            </div>
          </div>

          {/* Grounding guarantee info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center text-slate-800 font-semibold space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Strict University Policy Compliance</span>
            </div>
            <p>
              This response was verified against the campus repository. Gemini is instructed not to make up information if the policy text does not explicitly cover it.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100/80 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Close Citation
          </button>
        </div>
      </div>
    </div>
  );
};
