import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Download, Share2, Copy, Check, ExternalLink, 
  MoreVertical, Edit3, Trash2, CopyPlus, Tag, Eye, ShieldCheck, Link2, X, Globe, Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function QRCodeCard({
  qr,
  onDownload,
  onShare,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleType,
  onUpdate
}) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Quick inline URL editing state
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editedUrl, setEditedUrl] = useState(qr.targetUrl || '');
  const [savingUrl, setSavingUrl] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [urlError, setUrlError] = useState('');

  const isDirect = qr.qrType === 'direct';
  const qrValue = isDirect || !qr.shortCode
    ? qr.targetUrl
    : `${window.location.origin}/r/${qr.shortCode}`;

  const copyUrl = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(qr.targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleQuickUrlSave = async (e) => {
    if (e) e.preventDefault();
    setUrlError('');

    let trimmed = editedUrl.trim();
    if (!trimmed) {
      setUrlError('URL cannot be empty');
      return;
    }

    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }

    try {
      new URL(trimmed);
    } catch {
      setUrlError('Invalid URL format');
      return;
    }

    setSavingUrl(true);
    try {
      const res = await api.updateQRCode(qr.id, { targetUrl: trimmed });
      if (onUpdate) {
        onUpdate(res.data);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditingUrl(false);
      }, 900);
    } catch (err) {
      setUrlError(err.message || 'Failed to update link');
    } finally {
      setSavingUrl(false);
    }
  };

  const formattedDate = new Date(qr.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="relative group bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {qr.category || 'General'}
            </span>
            {isDirect ? (
              <button
                type="button"
                onClick={() => onToggleType && onToggleType(qr)}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                title="Click to toggle between Direct URL and Dynamic Redirect"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>⚡ Direct URL</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleType && onToggleType(qr)}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/25 transition-colors cursor-pointer"
                title="Currently routes through localhost/r. Click to switch to Direct URL!"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Dynamic ({qr.scanCount || 0} scans)</span>
              </button>
            )}
          </div>

          {/* Card Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)}></div>
                <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 py-1 overflow-hidden">
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(qr); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit Full Details</span>
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onDuplicate(qr); }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <CopyPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Duplicate QR</span>
                  </button>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(qr); }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete QR</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base text-white group-hover:text-blue-300 transition-colors line-clamp-1 mb-1">
          {qr.title}
        </h3>

        {/* Description if present */}
        {qr.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {qr.description}
          </p>
        )}

        {/* QR Visual Canvas */}
        <div className="my-4 flex flex-col items-center justify-center">
          <div 
            className="p-3 bg-white rounded-xl shadow-inner cursor-pointer transition-transform hover:scale-105"
            onClick={() => onShare(qr)}
            title="Click to view & share"
          >
            <QRCodeCanvas
              value={qrValue}
              size={140}
              fgColor={qr.designConfig?.fgColor || '#000000'}
              bgColor={qr.designConfig?.bgColor || '#ffffff'}
              level={qr.designConfig?.level || 'M'}
              marginSize={qr.designConfig?.margin || 2}
            />
          </div>
          <div className="mt-2 text-[11px] text-center">
            {isDirect ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1 justify-center">
                <span>⚡ Scans directly to your link</span>
              </span>
            ) : (
              <span className="text-amber-300/90 font-medium flex items-center gap-1 justify-center">
                <span>🔄 Redirects via /r/:code</span>
              </span>
            )}
          </div>
        </div>

        {/* Target URL association & Quick Inline Edit */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium flex items-center gap-1 text-slate-300">
              <Link2 className="w-3.5 h-3.5 text-blue-400" />
              Target URL
            </span>

            <div className="flex items-center space-x-2">
              {!isEditingUrl ? (
                <>
                  <button
                    onClick={() => {
                      setEditedUrl(qr.targetUrl);
                      setUrlError('');
                      setIsEditingUrl(true);
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 px-2 py-0.5 rounded hover:bg-emerald-500/10 transition-colors"
                    title="Quickly change this URL"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Change Link</span>
                  </button>

                  <button
                    onClick={copyUrl}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingUrl(false)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* Display Mode vs Inline Edit Form */}
          {!isEditingUrl ? (
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300 overflow-hidden group/box hover:border-slate-700 transition-colors">
              <span className="truncate flex-1" title={qr.targetUrl}>
                {qr.targetUrl}
              </span>
              <a
                href={qr.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                title="Open Target URL in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <form onSubmit={handleQuickUrlSave} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editedUrl}
                  onChange={(e) => setEditedUrl(e.target.value)}
                  placeholder="https://example.com/new-link"
                  autoFocus
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-mono text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={savingUrl}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all shrink-0 disabled:opacity-50"
                  title="Save new link"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : savingUrl ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
              {urlError && (
                <p className="text-[10px] text-rose-400">{urlError}</p>
              )}
              <p className="text-[10px] text-slate-500">
                Tip: Press Enter to save link instantly.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          Created {formattedDate}
        </span>

        <div className="flex items-center space-x-1.5">
          {/* Quick Edit Button */}
          <button
            onClick={() => onEdit(qr)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            title="Edit QR Code details & style"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
            <span>Edit</span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => onShare(qr)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            title="Share QR Code"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Share</span>
          </button>

          {/* Download Button */}
          <button
            onClick={() => onDownload(qr)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-medium shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02]"
            title="Download QR Code"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
