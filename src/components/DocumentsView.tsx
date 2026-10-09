import React, { useState } from 'react';
import {
  BookOpen,
  Upload,
  Plus,
  RotateCcw,
  Trash2,
  Layers,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  AlertTriangle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { KnowledgeDocumentSummary, UserRole } from '../types';
import { CampusApi } from '../services/api';

interface DocumentsViewProps {
  documents: KnowledgeDocumentSummary[];
  onRefresh: () => void;
  role: UserRole;
  onOpenUpload: () => void;
  onInspectDocument: (id: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onRefresh,
  role,
  onOpenUpload,
  onInspectDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const categories = ['All', 'Academic', 'Financial Aid', 'Housing & Dining', 'Health & Wellness', 'Campus Transit', 'General'];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleToggleActive = async (id: string) => {
    setActionLoadingId(id);
    try {
      await CampusApi.toggleDocument(id, role);
      onRefresh();
    } catch (err: any) {
      alert(`Error toggling document: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await CampusApi.deleteDocument(id, role);
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) {
      alert(`Error deleting document: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset knowledge base to the official sample university policy handbooks?')) {
      return;
    }
    setIsResetting(true);
    try {
      await CampusApi.resetDemoDocuments(role);
      onRefresh();
    } catch (err: any) {
      alert(`Error resetting demo policies: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Academic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Financial Aid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Housing & Dining':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Health & Wellness':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Campus Transit':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const totalChunks = documents.reduce((acc, d) => acc + (d.active ? d.chunkCount : 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-md">
                Admin Control Portal
              </span>
              <span className="text-xs text-slate-500">• Server-Side RAG Repository</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Campus Knowledge Base Documents
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Upload, manage and index university handbooks, policy bulletins, and PDF guidelines used for student citation grounding.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs"
              title="Restore standard sample campus handbooks"
            >
              {isResetting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Restore Demo Policies</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-sm shadow-blue-500/20 flex items-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document (PDF / TXT)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Metric Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Documents</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{documents.length}</div>
            <span className="text-[11px] text-slate-500">Official campus sources</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active in RAG</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {documents.filter((d) => d.active).length}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">Eligible for citations</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Indexed Passages</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">{totalChunks}</div>
            <span className="text-[11px] text-slate-500">Searchable chunk vectors</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Grounding Model</span>
            <div className="text-sm font-bold text-slate-800 mt-2 truncate">Gemini 3.8 Flash</div>
            <span className="text-[11px] text-blue-600 font-medium">Zero-hallucination mode</span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search documents by title or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-medium text-slate-500 mr-1 hidden sm:inline">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Document Cards Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No documents found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search query or click "Upload Document" to index university policies.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredDocs.map((doc) => {
                const isLoading = actionLoadingId === doc.id;
                return (
                  <div
                    key={doc.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Left: Document info */}
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          doc.active
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            {doc.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getCategoryBadgeClass(
                              doc.category
                            )}`}
                          >
                            {doc.category}
                          </span>
                          {doc.isDemo && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded border border-slate-200">
                              Demo Data
                            </span>
                          )}
                        </div>

                        <div className="flex items-center flex-wrap gap-3 text-xs text-slate-500">
                          <span className="font-mono text-[11px] text-slate-600">{doc.filename}</span>
                          <span>•</span>
                          <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span className="font-semibold text-blue-700">
                            {doc.chunkCount} passage chunks
                          </span>
                          <span>•</span>
                          <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                      {/* Active Toggle */}
                      <button
                        onClick={() => handleToggleActive(doc.id)}
                        disabled={isLoading}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
                          doc.active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                        title={doc.active ? 'Click to exclude from RAG' : 'Click to include in RAG'}
                      >
                        {doc.active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active in RAG</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>

                      {/* Inspect Chunks */}
                      <button
                        onClick={() => onInspectDocument(doc.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors flex items-center space-x-1"
                        title="View parsed passages and chunk boundaries"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect Chunks</span>
                      </button>

                      {/* Delete */}
                      {deleteConfirmId === doc.id ? (
                        <div className="flex items-center space-x-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                          <span className="text-[11px] text-rose-700 font-semibold px-1">Confirm?</span>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={isLoading}
                            className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs hover:bg-slate-300"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(doc.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
