import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  X, Share2, Copy, Check, ExternalLink, Globe, 
  MessageCircle, Send, Mail, Code 
} from 'lucide-react';

function XTwitterIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.62 1.62 0 1 0 0-3.24 1.62 1.62 0 0 0 0 3.24m1.4 9.74v-8.37H5.06v8.37h2.8z"/>
    </svg>
  );
}

export default function ShareModal({ qr, isOpen, onClose }) {
  if (!isOpen || !qr) return null;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const qrShareUrl = qr.qrType === 'dynamic' && qr.shortCode
    ? `${window.location.origin}/r/${qr.shortCode}`
    : qr.targetUrl;

  const embedCode = `<a href="${qr.targetUrl}" target="_blank" rel="noopener noreferrer"><img src="${window.location.origin}/api/qrcodes/${qr.id}/download?format=png&size=256" alt="${qr.title}" width="256" height="256" /></a>`;

  const copyToClipboard = async (text, setter) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const copyQRImage = async () => {
    try {
      const canvas = document.getElementById(`share-canvas-${qr.id}`);
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2000);
        } catch {
          // fallback
        }
      });
    } catch (err) {
      console.error('Image copy failed:', err);
    }
  };

  const triggerNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: qr.title,
          text: `Check out ${qr.title}`,
          url: qrShareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Native share error:', err);
      }
    }
  };

  // Social share URLs
  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${qr.title}: ${qrShareUrl}`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${qr.title}`)}&url=${encodeURIComponent(qrShareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(qrShareUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(qrShareUrl)}&text=${encodeURIComponent(qr.title)}`,
    email: `mailto:?subject=${encodeURIComponent(qr.title)}&body=${encodeURIComponent(`Here is the link for ${qr.title}:\n${qrShareUrl}`)}`
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share QR Code</h3>
              <p className="text-xs text-slate-400">Distribute your QR code link or image anywhere</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* QR Visual Center */}
          <div className="flex flex-col items-center justify-center">
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <QRCodeCanvas
                id={`share-canvas-${qr.id}`}
                value={qrShareUrl}
                size={160}
                fgColor={qr.designConfig?.fgColor || '#000000'}
                bgColor={qr.designConfig?.bgColor || '#ffffff'}
                level={qr.designConfig?.level || 'M'}
                marginSize={qr.designConfig?.margin || 2}
              />
            </div>
            <h4 className="font-semibold text-white text-sm mt-3">{qr.title}</h4>
            <p className="text-xs text-slate-400 font-mono truncate max-w-xs">{qr.targetUrl}</p>
          </div>

          {/* Quick Action: Copy Image or Native Share */}
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={copyQRImage}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedImage ? 'Image Copied!' : 'Copy QR Image'}</span>
            </button>

            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={triggerNativeShare}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium border border-blue-500/30 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Device Share</span>
              </button>
            )}
          </div>

          {/* Share Link Row */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Shareable Direct Link
            </label>
            <div className="flex items-center">
              <input
                type="text"
                readOnly
                value={qrShareUrl}
                className="w-full px-3 py-2 rounded-l-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono outline-none"
              />
              <button
                onClick={() => copyToClipboard(qrShareUrl, setCopiedLink)}
                className="px-3.5 py-2 rounded-r-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Share to Socials & Messaging
            </label>
            <div className="grid grid-cols-5 gap-2">
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all text-center"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium">WhatsApp</span>
              </a>

              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-all text-center"
                title="Share on X / Twitter"
              >
                <XTwitterIcon className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium">X / Twitter</span>
              </a>

              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all text-center"
                title="Share on LinkedIn"
              >
                <LinkedinIcon className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium">LinkedIn</span>
              </a>

              <a
                href={shareLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all text-center"
                title="Share on Telegram"
              >
                <Send className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium">Telegram</span>
              </a>

              <a
                href={shareLinks.email}
                className="flex flex-col items-center p-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 transition-all text-center"
                title="Share via Email"
              >
                <Mail className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium">Email</span>
              </a>
            </div>
          </div>

          {/* HTML Embed Snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                HTML Embed Code
              </label>
              <button
                onClick={() => copyToClipboard(embedCode, setCopiedEmbed)}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                {copiedEmbed ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEmbed ? 'Snippet Copied' : 'Copy Embed'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto select-all">
              {embedCode}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
