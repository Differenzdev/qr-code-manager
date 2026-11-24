import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Download, Share2, ExternalLink, Edit3, Trash2, CopyPlus, Link2 
} from 'lucide-react';

export default function QRCodeTableView({
  qrcodes,
  onDownload,
  onShare,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleType
}) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-950/70 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
          <tr>
            <th className="py-3 px-4">Preview</th>
            <th className="py-3 px-4">Title & Details</th>
            <th className="py-3 px-4">Associated Target URL</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Type / Scans</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {qrcodes.map((qr) => {
            const qrValue = qr.qrType === 'dynamic' && qr.shortCode
              ? `${window.location.origin}/r/${qr.shortCode}`
              : qr.targetUrl;

            return (
              <tr key={qr.id} className="hover:bg-slate-800/40 transition-colors">
                {/* QR Mini Preview */}
                <td className="py-3 px-4">
                  <div 
                    className="p-1.5 bg-white rounded-lg shadow-sm w-12 h-12 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => onShare(qr)}
                    title="View QR Code"
                  >
                    <QRCodeCanvas
                      value={qrValue}
                      size={40}
                      fgColor={qr.designConfig?.fgColor || '#000000'}
                      bgColor={qr.designConfig?.bgColor || '#ffffff'}
                      level="L"
                      marginSize={1}
                    />
                  </div>
                </td>

                {/* Title & Created Date */}
                <td className="py-3 px-4 max-w-xs">
                  <div className="font-semibold text-white truncate" title={qr.title}>
                    {qr.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(qr.createdAt).toLocaleDateString()}
                  </div>
                </td>

                {/* Target URL */}
                <td className="py-3 px-4 max-w-sm">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-xs text-blue-400 truncate max-w-[240px]" title={qr.targetUrl}>
                      {qr.targetUrl}
                    </span>
                    <button
                      onClick={() => onEdit(qr)}
                      className="text-slate-400 hover:text-emerald-400 p-1 hover:bg-slate-800 rounded transition-colors"
                      title="Edit this URL"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={qr.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                      title="Open URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </td>

                {/* Category */}
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {qr.category || 'General'}
                  </span>
                </td>

                {/* Type & Scans */}
                <td className="py-3 px-4">
                  {qr.qrType === 'dynamic' ? (
                    <button
                      onClick={() => onToggleType && onToggleType(qr)}
                      className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                      title="Currently redirects through /r/:code. Click to switch to Direct URL!"
                    >
                      Dynamic ({qr.scanCount || 0} scans)
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggleType && onToggleType(qr)}
                      className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                      title="Scans directly to saved link. Click to switch to Dynamic!"
                    >
                      ⚡ Direct URL
                    </button>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => onDownload(qr)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Download with custom name"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onShare(qr)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Share QR Code"
                    >
                      <Share2 className="w-4 h-4 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => onEdit(qr)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit QR Code"
                    >
                      <Edit3 className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => onDuplicate(qr)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <CopyPlus className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => onDelete(qr)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
