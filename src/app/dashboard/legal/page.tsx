'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { RichTextEditor, RichTextView } from '@/components/ui/RichTextEditor';
import { legalService, LegalDocument, LegalDocumentType } from '@/services/legal.service';
import { FiEdit, FiSave, FiX, FiFileText, FiClock, FiEye, FiEdit as FiEdit2 } from '@/utils/icons';
import toast from 'react-hot-toast';

const DOC_META: Record<LegalDocumentType, { label: string; description: string; color: string }> = {
  PRIVACY_POLICY: {
    label: 'Privacy Policy',
    description: 'Explains how user data is collected, used, and protected.',
    color: 'blue',
  },
  TERMS_AND_CONDITIONS: {
    label: 'Terms & Conditions',
    description: 'The rules and guidelines users agree to when using the app.',
    color: 'purple',
  },
};

type TabMode = 'edit' | 'preview';

function DocEditor({
  doc,
  onClose,
}: {
  doc: LegalDocument;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);
  const [tab, setTab] = useState<TabMode>('edit');

  const mutation = useMutation({
    mutationFn: () => legalService.updateDocument(doc.type, { title, content }),
    onSuccess: () => {
      toast.success(`${DOC_META[doc.type].label} updated successfully`);
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      onClose();
    },
    onError: () => {
      toast.error('Failed to update document');
    },
  });

  const isDirty = title !== doc.title || content !== doc.content;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              DOC_META[doc.type].color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
            }`}>
              <FiFileText className={`w-4 h-4 ${
                DOC_META[doc.type].color === 'blue' ? 'text-blue-600' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit {DOC_META[doc.type].label}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Version {doc.version} → {doc.version + 1} on save</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Title input */}
        <div className="px-6 pt-5 pb-3">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Document title"
          />
        </div>

        {/* Edit / Preview tabs */}
        <div className="px-6 pb-3">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
            <button
              onClick={() => setTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'edit'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <FiEdit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => setTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <FiEye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="px-6 pb-5">
          {tab === 'edit' ? (
            <RichTextEditor value={content} onChange={setContent} minHeight="450px" />
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 min-h-[450px] bg-white dark:bg-gray-900 overflow-auto">
              {content && content !== '<p></p>' ? (
                <RichTextView html={content} />
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-sm italic">No content yet. Switch to Edit tab to start writing.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Saving will increment the version number. Users who previously agreed will see a &quot;requires re-consent&quot; flag.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !isDirty || !content.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave className="w-4 h-4" />
              {mutation.isPending ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LegalDocumentsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [editing, setEditing] = useState<LegalDocument | null>(null);
  const [previewing, setPreviewing] = useState<LegalDocument | null>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['legal-documents'],
    queryFn: () => legalService.getAllDocuments(),
    enabled: !!user && isAdmin,
  });

  if (!isLoading && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (!isLoading && !isAdmin) {
    router.push('/dashboard');
    return null;
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Legal Documents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage the Privacy Policy and Terms &amp; Conditions displayed to users. Changes take effect immediately.
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl">
          <span className="text-lg mt-0.5">⚠️</span>
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Important:</strong> Each save increments the document version. Users who consented to a previous version will be prompted to re-agree on their next login.
          </div>
        </div>

        {/* Document cards */}
        {docsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[0, 1].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6" />
                <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded mb-4" />
                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(documents ?? []).map(doc => {
              const meta = DOC_META[doc.type];
              const isBlue = meta.color === 'blue';
              const isEmpty = !doc.content || doc.content === '<p></p>' || doc.content.trim() === 'Privacy policy content goes here.' || doc.content.trim() === 'Terms and conditions content goes here.';

              return (
                <div key={doc.type} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isBlue ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        <FiFileText className={`w-5 h-5 ${isBlue ? 'text-blue-600' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{meta.label}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{meta.description}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isBlue ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}>
                      v{doc.version}
                    </span>
                  </div>

                  {/* Content preview */}
                  <div className={`rounded-xl p-3 text-xs min-h-[72px] border ${
                    isEmpty
                      ? 'border-dashed border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10'
                      : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'
                  }`}>
                    {isEmpty ? (
                      <p className="text-amber-600 dark:text-amber-400 italic">⚠ Placeholder content — click Edit to write the real document.</p>
                    ) : (
                      <div className="text-gray-600 dark:text-gray-300 line-clamp-3 prose-xs" dangerouslySetInnerHTML={{ __html: doc.content }} />
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <FiClock className="w-3.5 h-3.5" />
                    Last updated: {formatDate(doc.updatedAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-2">
                    <button
                      onClick={() => setPreviewing(doc)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FiEye className="w-4 h-4" /> Preview
                    </button>
                    <button
                      onClick={() => setEditing(doc)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
                        isBlue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      <FiEdit className="w-4 h-4" /> Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How it works */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">How it works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex flex-col gap-1">
              <span className="text-lg">✏️</span>
              <strong className="text-gray-700 dark:text-gray-300">1. Edit</strong>
              Use the rich text editor to write your document with proper formatting — headings, lists, bold, links, etc.
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg">📋</span>
              <strong className="text-gray-700 dark:text-gray-300">2. Save & Publish</strong>
              Saving increments the version number and immediately updates what users see in the mobile app and web.
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg">🔔</span>
              <strong className="text-gray-700 dark:text-gray-300">3. Re-consent</strong>
              Users who agreed to an older version will be flagged as needing to re-agree on their next login.
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editing && <DocEditor doc={editing} onClose={() => setEditing(null)} />}

      {/* Preview modal */}
      {previewing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{previewing.title}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">Version {previewing.version} — as seen by users</p>
              </div>
              <button onClick={() => setPreviewing(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <RichTextView html={previewing.content} />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { setPreviewing(null); setEditing(previewing); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <FiEdit className="w-4 h-4" /> Edit this document
              </button>
              <button onClick={() => setPreviewing(null)} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
