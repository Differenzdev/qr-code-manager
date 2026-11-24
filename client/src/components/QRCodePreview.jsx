import React from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

export default function QRCodePreview({
  value,
  size = 200,
  fgColor = '#000000',
  bgColor = '#ffffff',
  level = 'M',
  margin = 2,
  asSvg = false,
  canvasRef = null,
  svgRef = null
}) {
  if (!value) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-700 text-slate-500 text-xs text-center p-4 bg-slate-900/50"
      >
        Enter a URL to generate QR code preview
      </div>
    );
  }

  return (
    <div className="p-3 bg-white rounded-xl shadow-md inline-flex items-center justify-center">
      {asSvg ? (
        <QRCodeSVG
          ref={svgRef}
          value={value}
          size={size}
          fgColor={fgColor}
          bgColor={bgColor}
          level={level}
          marginSize={margin}
        />
      ) : (
        <QRCodeCanvas
          ref={canvasRef}
          value={value}
          size={size}
          fgColor={fgColor}
          bgColor={bgColor}
          level={level}
          marginSize={margin}
        />
      )}
    </div>
  );
}
