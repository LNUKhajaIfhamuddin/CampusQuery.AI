import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  FileCode,
  Check,
  AlertCircle,
  Loader2,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../types';
import { CampusApi } from '../services/api';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: UserRole;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  role,
}) => {
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Academic');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    if (!title) {
      // Auto-suggest title from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a document title.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'file') {
        if (!selectedFile) {
          throw new Error('Please select a PDF or text document to upload.');
        }

        const isPdf = selectedFile.type.includes('pdf') || selectedFile.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
          // Read as Base64 for PDF
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              // strip data:application/pdf;base64,
              const base64 = result.split(',')[1] || result;
              resolve(base64);
            };
            reader.onerror = (err) => reject(err);
          });
          reader.readAsDataURL(selectedFile);
          const base64Data = await base64Promise;

          await CampusApi.uploadDocument(
            {
              title: title.trim(),
              category,
              filename: selectedFile.name,
              base64Data,
              mimeType: selectedFile.type || 'application/pdf',
            },
            role
          );
        } else {
          // Read as text
          const reader = new FileReader();
          const textPromise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
          });
          reader.readAsText(selectedFile);
          const text = await textPromise;

          await CampusApi.uploadDocument(
            {
              title: title.trim(),
              category,
              filename: selectedFile.name,
              content: text,
              mimeType: selectedFile.type || 'text/plain',
            },
            role
          );
        }
      } else {
        // Direct Text Paste
        if (!textContent.trim() || textContent.trim().length < 20) {
          throw new Error('Please provide at least 20 characters of readable document policy text.');
        }

        await CampusApi.uploadDocument(
          {
            title: title.trim(),
            category,
            filename: `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`,
            content: textContent.trim(),
            mimeType: 'text/plain',
          },
          role
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Failed to upload and index document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Knowledge Management
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Upload & Index Campus Policy Document
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3">
          <button
            onClick={() => setMode('file')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              mode === 'file'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload File (PDF / TXT)
          </button>
          <button
            onClick={() => setMode('text')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              mode === 'text'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Direct Text / Memo Compose
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Graduate Thesis Formatting & Submission Guidelines"
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Campus Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="Academic">Academic Regulations & Degree Policies</option>
              <option value="Financial Aid">Financial Aid, Scholarships & Grants</option>
              <option value="Housing & Dining">Residential Life, Dorms & Dining</option>
              <option value="Health & Wellness">Health Center, Therapy & CAPS</option>
              <option value="Campus Transit">Parking, Shuttles & Transportation</option>
              <option value="General">General Campus Services & Facilities</option>
            </select>
          </div>

          {/* File Upload Mode */}
          {mode === 'file' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Select File (PDF, TXT, MD) *
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                }`}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.txt,.md,text/plain,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-3 text-slate-800">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop to change
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">
                      Click to choose or drag & drop a PDF or text file
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supports University Handbooks, Bulletins, PDF Policy guides, or TXT memos
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Direct Text Input Mode */
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Document Policy Text *
              </label>
              <textarea
                rows={8}
                required
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste or type official campus guidelines here. Use 'Section 1: ...' format for optimal automatic passage chunking."
                className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {textContent.length} characters • Chunks are automatically partitioned by section for high-precision RAG retrieval.
              </p>
            </div>
          )}

          {/* RAG indexing info */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Uploaded documents are instantly processed on the server, split into semantic passage chunks, and made available for student citation grounding.
            </span>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing & Chunking...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Index into Knowledge Base</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
