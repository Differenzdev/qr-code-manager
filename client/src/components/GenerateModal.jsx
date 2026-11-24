import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  X, Sparkles, Link2, Palette, ShieldCheck, Check, AlertCircle, Layers, Globe 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

const COLOR_PRESETS = [
  { name: 'Classic Black', fg: '#000000', bg: '#ffffff' },
  { name: 'Royal Sapphire', fg: '#1e3a8a', bg: '#ffffff' },
  { name: 'Emerald Forest', fg: '#047857', bg: '#f0fdf4' },
  { name: 'Deep Violet', fg: '#6b21a8', bg: '#faf5ff' },
  { name: 'Crimson Sunset', fg: '#991b1b', bg: '#fff1f2' },
  { name: 'Midnight Neon', fg: '#06b6d4', bg: '#090d16' },
];

const CATEGORIES = [
  'General', 'Marketing', 'Product', 'Portfolio', 'Social', 'Event', 'Personal', 'Other'
];

export default function GenerateModal({ isOpen, onClose, onCreated }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [category, setCategory] = useState('Marketing');
  const [qrType, setQrType] = useState('direct'); // Default to Direct URL so phone scans immediately open the saved link
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [level, setLevel] = useState('M');
  const [margin, setMargin] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate URL format
  const isValidUrl = (url) => {
    if (!url) return false;
    let test = url.trim();
    if (!/^https?:\/\//i.test(test)) test = 'https://' + test;
    try {
      new URL(test);
      return true;
    } catch {
      return false;
    }
  };

  const previewValue = targetUrl && isValidUrl(targetUrl)
    ? (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') ? targetUrl : 'https://' + targetUrl)
    : 'https://example.com';

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a title or name for this QR code.');
      return;
    }

    if (!targetUrl.trim() || !isValidUrl(targetUrl)) {
      setError('Please provide a valid destination URL (e.g., https://mybrand.com).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        targetUrl: targetUrl.trim(),
        category,
        qrType,
        designConfig: {
          fgColor,
          bgColor,
          level,
          margin: Number(margin),
          size: 256
        }
      };

      const res = await api.createQRCode(payload);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Generate & Save New QR Code</h2>
              <p className="text-xs text-slate-400">Permanently associates your destination URL in the database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
          {/* Left Form: 7 cols */}
          <form onSubmit={handleSave} className="md:col-span-7 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* QR Name / Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                QR Code Name / Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Promo 2026, Restaurant Menu, Portfolio"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                required
              />
            </div>

            {/* Associated Target URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Associated Target URL <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-blue-400 font-medium">Permanently Stored</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com/your-page"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                This URL is permanently bound to this QR code and will never reset across sessions or browser changes.
              </p>
            </div>

            {/* QR Scan Behavior / Routing Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                QR Code Scan Behavior
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setQrType('direct')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    qrType === 'direct'
                      ? 'border-blue-500 bg-blue-500/15 text-white ring-1 ring-blue-500/50'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-xs font-bold text-white">Direct URL (Recommended)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Encodes your exact review/target link into the QR code. When scanned by any phone or camera, it immediately opens the destination link directly (no localhost redirect).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setQrType('dynamic')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    qrType === 'dynamic'
                      ? 'border-blue-500 bg-blue-500/15 text-white ring-1 ring-blue-500/50'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span className="text-xs font-bold text-white">Dynamic Redirect</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Routes through server redirect (/r/:code) to track scan counts. Note: phone scanners must be able to reach your host address.
                  </p>
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-sm text-slate-200 outline-none transition-all"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Optional Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description / Notes <span className="text-slate-500 text-[10px]">(Optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context, campaign details, or usage notes..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Color Palette Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setFgColor(p.fg); setBgColor(p.bg); }}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                      fgColor === p.fg && bgColor === p.bg 
                        ? 'border-blue-500 bg-blue-500/10 text-white' 
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <span 
                      className="w-3.5 h-3.5 rounded-full border border-slate-700" 
                      style={{ backgroundColor: p.fg }} 
                    />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers & Error Correction */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Foreground</label>
                <div className="flex items-center space-x-2 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-300">{fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Background</label>
                <div className="flex items-center space-x-2 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-300">{bgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Error Correction</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
                >
                  <option value="L">L (7% recovery)</option>
                  <option value="M">M (15% standard)</option>
                  <option value="Q">Q (25% high)</option>
                  <option value="H">H (30% best)</option>
                </select>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save QR Code</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Live Preview: 5 cols */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Real-time Live Preview
            </span>

            <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
              <QRCodeCanvas
                value={previewValue}
                size={180}
                fgColor={fgColor}
                bgColor={bgColor}
                level={level}
                marginSize={margin}
              />
            </div>

            <div className="mt-4 text-center max-w-[220px]">
              <div className="font-semibold text-sm text-white truncate">
                {title || 'Untitled QR Code'}
              </div>
              <div className="font-mono text-[11px] text-blue-400 truncate mt-0.5" title={previewValue}>
                {targetUrl || 'https://example.com'}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Persistent URL Guaranteed</span>
              </div>
              <p>Stored safely in the server database. Changing browsers, logging back in, or returning months later will never reset it.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
