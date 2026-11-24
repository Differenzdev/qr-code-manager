import React, { useState, useRef } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { X, Download, FileType, Check, Image as ImageIcon } from 'lucide-react';

export default function DownloadModal({ qr, isOpen, onClose }) {
  if (!isOpen || !qr) return null;

  // Sanitize initial title into clean filename
  const defaultFilename = (qr.title || 'qrcode')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const [filename, setFilename] = useState(defaultFilename || 'my-qr-code');
  const [format, setFormat] = useState('png'); // 'png' | 'svg' | 'jpeg'
  const [resolution, setResolution] = useState(1024); // 256, 512, 1024, 2048
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);

  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  const qrValue = qr.qrType === 'dynamic' && qr.shortCode
    ? `${window.location.origin}/r/${qr.shortCode}`
    : qr.targetUrl;

  const handleDownload = () => {
    setDownloading(true);

    const cleanName = (filename.trim() || 'qr-code')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    try {
      if (format === 'svg') {
        // SVG Vector Download
        const svgEl = svgRef.current;
        if (!svgEl) throw new Error('SVG reference not found');

        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = `${cleanName}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
      } else {
        // High-res Canvas Raster Download (PNG or JPEG)
        const canvas = canvasRef.current;
        if (!canvas) throw new Error('Canvas reference not found');

        // Create high-resolution export canvas
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = resolution;
        exportCanvas.height = resolution;
        const ctx = exportCanvas.getContext('2d');

        // Draw image smoothly
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(canvas, 0, 0, resolution, resolution);

        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const fileExt = format === 'jpeg' ? 'jpg' : 'png';
        const dataUrl = exportCanvas.toDataURL(mimeType, 1.0);

        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = `${cleanName}.${fileExt}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDownloading(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Download error:', err);
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Download QR Code</h3>
              <p className="text-xs text-slate-400">Specify custom file name, format, and resolution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden render elements for high-res export */}
        <div className="hidden">
          <QRCodeCanvas
            ref={canvasRef}
            value={qrValue}
            size={512}
            fgColor={qr.designConfig?.fgColor || '#000000'}
            bgColor={qr.designConfig?.bgColor || '#ffffff'}
            level={qr.designConfig?.level || 'M'}
            marginSize={qr.designConfig?.margin || 2}
          />
          <QRCodeSVG
            ref={svgRef}
            value={qrValue}
            size={512}
            fgColor={qr.designConfig?.fgColor || '#000000'}
            bgColor={qr.designConfig?.bgColor || '#ffffff'}
            level={qr.designConfig?.level || 'M'}
            marginSize={qr.designConfig?.margin || 2}
          />
        </div>

        <div className="p-6 space-y-4">
          {/* User-Defined File Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Custom File Name <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g. spring-menu-qr"
                className="w-full px-3.5 py-2.5 rounded-l-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-sm text-white placeholder-slate-500 outline-none font-mono"
              />
              <span className="px-3.5 py-2.5 rounded-r-xl bg-slate-800 border-y border-r border-slate-700 text-xs font-mono text-slate-400">
                .{format === 'jpeg' ? 'jpg' : format}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              The file will be saved on your computer with this exact name.
            </p>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select File Format
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'png', label: 'PNG Image', desc: 'Standard / Retina' },
                { id: 'svg', label: 'SVG Vector', desc: 'Infinite Scaling / Print' },
                { id: 'jpeg', label: 'JPEG Image', desc: 'Compact size' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    format === f.id
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400'
                  }`}
                >
                  <div className="font-semibold text-xs text-white">{f.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution selector (only for PNG/JPEG) */}
          {format !== 'svg' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Export Resolution
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { size: 256, label: '256 px' },
                  { size: 512, label: '512 px' },
                  { size: 1024, label: '1024 px (HD)' },
                  { size: 2048, label: '2048 px (Print)' }
                ].map(r => (
                  <button
                    key={r.size}
                    type="button"
                    onClick={() => setResolution(r.size)}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-medium transition-all ${
                      resolution === r.size
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300 font-semibold'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Download Preview Card */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0">
              <QRCodeCanvas
                value={qrValue}
                size={40}
                fgColor={qr.designConfig?.fgColor || '#000000'}
                bgColor={qr.designConfig?.bgColor || '#ffffff'}
                level="M"
              />
            </div>
            <div className="overflow-hidden text-xs">
              <div className="font-semibold text-white truncate">
                {filename || 'qrcode'}.{format === 'jpeg' ? 'jpg' : format}
              </div>
              <div className="text-slate-400 text-[11px] truncate">
                {format === 'svg' ? 'Vector SVG' : `${resolution} x ${resolution} px ${format.toUpperCase()}`}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Downloaded!</span>
                </>
              ) : downloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
