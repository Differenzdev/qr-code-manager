import React, { useState } from 'react';
import { X, Edit3, Globe, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const CATEGORIES = [
  'General', 'Marketing', 'Product', 'Portfolio', 'Social', 'Event', 'Personal', 'Other'
];

export default function EditModal({ qr, isOpen, onClose, onUpdated }) {
  if (!isOpen || !qr) return null;

  const [title, setTitle] = useState(qr.title || '');
  const [description, setDescription] = useState(qr.description || '');
  const [targetUrl, setTargetUrl] = useState(qr.targetUrl || '');
  const [category, setCategory] = useState(qr.category || 'General');
  const [qrType, setQrType] = useState(qr.qrType || 'direct');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    if (!targetUrl.trim()) {
      setError('Target URL cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const res = await api.updateQRCode(qr.id, {
        title: title.trim(),
        description: description.trim(),
        targetUrl: targetUrl.trim(),
        category,
        qrType
      });

      onUpdated(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit QR Code</h3>
              <p className="text-xs text-slate-400">Update title, category, or destination URL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Title / Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-sm text-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Associated Target URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-sm text-white font-mono outline-none"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Updating this URL persists permanently in the database.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              QR Code Scan Behavior
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQrType('direct')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  qrType === 'direct'
                    ? 'border-blue-500 bg-blue-500/15 text-white ring-1 ring-blue-500/50'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Direct URL
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Phone scans directly open saved link
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQrType('dynamic')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  qrType === 'dynamic'
                    ? 'border-blue-500 bg-blue-500/15 text-white ring-1 ring-blue-500/50'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  Dynamic Redirect
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Redirects through /r/:code
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Update QR Code</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
