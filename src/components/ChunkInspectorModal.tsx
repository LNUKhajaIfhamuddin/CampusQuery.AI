import React, { useState, useEffect } from 'react';
import { X, BookOpen, Layers, Hash, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { KnowledgeDocumentDetail, Chunk } from '../types';
import { CampusApi } from '../services/api';

interface ChunkInspectorModalProps {
  documentId: string | null;
  onClose: () => void;
}

export const ChunkInspectorModal: React.FC<ChunkInspectorModalProps> = ({
  documentId,
  onClose,
}) => {
  const [detail, setDetail] = useState<KnowledgeDocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (!documentId) {
      setDetail(null);
      return;
    }
    const fetchDoc = async () => {
      setIsLoading(true);
      try {
        const data = await CampusApi.getDocumentDetail(documentId);
        setDetail(data);
      } catch (err) {
        console.error('Failed to load document detail:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [documentId]);

  if (!documentId) return null;

  const chunks = detail?.chunks || [];
  const filteredChunks = chunks.filter(
    (c) =>
      c.sectionTitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.text.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  RAG Index Inspector
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {chunks.length} Passages Indexed
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 leading-snug">
                {detail?.title || 'Loading document chunks...'}
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

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Filter chunks by keyword or section title..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <div className="text-xs text-slate-500 whitespace-nowrap">
            Showing {filteredChunks.length} of {chunks.length}
          </div>
        </div>

        {/* Chunks List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs">Fetching parsed passage chunks...</p>
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No chunks matched your filter.
            </div>
          ) : (
            filteredChunks.map((chunk, idx) => (
              <div
                key={chunk.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-md border border-blue-200">
                      Chunk #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {chunk.sectionTitle}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-mono">
                    {chunk.charCount} chars
                  </span>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/70 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                  {chunk.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Grounding Engine: Gemini 3.8 Flash RAG</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
