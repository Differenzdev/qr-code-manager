import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({ qr, isOpen, onClose, onConfirm }) {
  if (!isOpen || !qr) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">
          Delete QR Code?
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Are you sure you want to permanently delete <strong className="text-slate-200">"{qr.title}"</strong>? 
          Any dynamic links associated with this QR code will stop redirecting.
        </p>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(qr.id)}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-500/25 transition-all"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}
