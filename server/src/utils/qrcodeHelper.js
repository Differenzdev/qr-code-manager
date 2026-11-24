const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

// Helper to generate SVG or high-res PNG from URL/content
async function generateQRDataURL(text, options = {}) {
  const {
    level = 'M',
    fgColor = '#000000',
    bgColor = '#ffffff',
    margin = 2,
    size = 512
  } = options;

  return QRCode.toDataURL(text, {
    errorCorrectionLevel: level,
    margin: Number(margin),
    width: Number(size),
    color: {
      dark: fgColor,
      light: bgColor
    }
  });
}

async function generateQRSVG(text, options = {}) {
  const {
    level = 'M',
    fgColor = '#000000',
    bgColor = '#ffffff',
    margin = 2,
    size = 512
  } = options;

  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: level,
    margin: Number(margin),
    width: Number(size),
    color: {
      dark: fgColor,
      light: bgColor
    }
  });
}

module.exports = {
  generateQRDataURL,
  generateQRSVG
};
