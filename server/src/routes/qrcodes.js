const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { generateQRDataURL, generateQRSVG } = require('../utils/qrcodeHelper');

// Helper: Ensure URL has valid protocol
function normalizeUrl(url) {
  if (!url) return '';
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
}

// Helper: generate short unique code for dynamic QR codes
function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

// GET all QR codes - SHARED collection across all users/browsers!
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, category, sortBy, sortOrder } = req.query;
    const qrcodes = await db.getQRCodes(req.user.id, { search, category, sortBy, sortOrder });
    const stats = await db.getStats();

    res.json({
      success: true,
      data: qrcodes,
      stats
    });
  } catch (err) {
    console.error('[GET /api/qrcodes error]', err);
    res.status(500).json({ error: 'Failed to retrieve QR codes' });
  }
});

// GET stats overview
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET single QR code by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const qr = await db.getQRCodeById(req.params.id);
    if (!qr) {
      return res.status(404).json({ error: 'QR Code not found' });
    }
    res.json({ success: true, data: qr });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve QR code details' });
  }
});

// POST Create & Save a new QR Code with Associated URL
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      targetUrl,
      category,
      tags,
      qrType = 'direct',
      designConfig,
      customShortCode
    } = req.body;

    if (!targetUrl || !targetUrl.trim()) {
      return res.status(400).json({ error: 'A valid target URL is required' });
    }

    const cleanUrl = normalizeUrl(targetUrl);
    try {
      new URL(cleanUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format. Please provide a valid web link.' });
    }

    let shortCode = customShortCode ? customShortCode.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') : generateShortCode();
    // Check collision
    if (await db.getQRCodeByShortCode(shortCode)) {
      shortCode = generateShortCode();
    }

    const id = 'qr_' + uuidv4().substring(0, 10);

    const newQR = await db.createQRCode({
      id,
      userId: req.user.id,
      title: title && title.trim() ? title.trim() : 'QR Code - ' + new Date().toLocaleDateString(),
      description: description ? description.trim() : '',
      targetUrl: cleanUrl, // Permanently stored association
      shortCode,
      qrType: qrType === 'dynamic' ? 'dynamic' : 'direct',
      category: category && category.trim() ? category.trim() : 'General',
      tags: Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
      designConfig: designConfig || {
        fgColor: '#000000',
        bgColor: '#ffffff',
        level: 'M',
        margin: 2,
        size: 256
      }
    });

    res.status(201).json({
      success: true,
      message: 'QR Code created and saved persistently',
      data: newQR
    });
  } catch (err) {
    console.error('[POST /api/qrcodes error]', err);
    res.status(500).json({ error: 'Failed to create QR code' });
  }
});

// PUT Update an existing QR Code (URL, title, design, category)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, targetUrl, category, tags, designConfig, qrType } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category.trim();
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
    if (designConfig !== undefined) updates.designConfig = designConfig;
    if (qrType !== undefined) updates.qrType = qrType;

    if (targetUrl !== undefined) {
      const cleanUrl = normalizeUrl(targetUrl);
      try {
        new URL(cleanUrl);
        updates.targetUrl = cleanUrl;
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }
    }

    const updated = await db.updateQRCode(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'QR Code not found' });
    }

    res.json({
      success: true,
      message: 'QR Code updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('[PUT /api/qrcodes/:id error]', err);
    res.status(500).json({ error: 'Failed to update QR code' });
  }
});

// DELETE a QR Code
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await db.deleteQRCode(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'QR Code not found' });
    }
    res.json({ success: true, message: 'QR Code deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete QR code' });
  }
});

// POST Duplicate QR Code
router.post('/:id/duplicate', requireAuth, async (req, res) => {
  try {
    const source = await db.getQRCodeById(req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Source QR Code not found' });
    }

    const newQR = await db.createQRCode({
      id: 'qr_' + uuidv4().substring(0, 10),
      userId: req.user.id,
      title: `${source.title} (Copy)`,
      description: source.description,
      targetUrl: source.targetUrl,
      shortCode: generateShortCode(),
      qrType: source.qrType,
      category: source.category,
      tags: [...(source.tags || [])],
      designConfig: { ...source.designConfig }
    });

    res.status(201).json({
      success: true,
      message: 'QR Code duplicated successfully',
      data: newQR
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to duplicate QR code' });
  }
});

// GET Server-rendered SVG or PNG for high-res download
router.get('/:id/download', async (req, res) => {
  try {
    const { format = 'png', size = 512, filename } = req.query;
    const qr = await db.getQRCodeById(req.params.id);
    if (!qr) {
      return res.status(404).send('QR Code not found');
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const content = qr.qrType === 'dynamic'
      ? `${protocol}://${host}/r/${qr.shortCode}`
      : qr.targetUrl;

    const downloadFileName = filename 
      ? `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.${format}`
      : `${(qr.title || 'qrcode').replace(/[^a-zA-Z0-9_-]/g, '_')}.${format}`;

    if (format === 'svg') {
      const svg = await generateQRSVG(content, {
        ...qr.designConfig,
        size: Number(size)
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
      return res.send(svg);
    } else {
      const dataUrl = await generateQRDataURL(content, {
        ...qr.designConfig,
        size: Number(size)
      });
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
      return res.send(imgBuffer);
    }
  } catch (err) {
    console.error('[Download error]', err);
    res.status(500).send('Failed to generate download');
  }
});

// GET Public view data for sharing a QR code
router.get('/public/:id', async (req, res) => {
  try {
    const qr = await db.getQRCodeById(req.params.id);
    if (!qr) {
      return res.status(404).json({ error: 'Shared QR Code not found' });
    }
    const host = req.get('host');
    const protocol = req.protocol;
    const dynamicUrl = `${protocol}://${host}/r/${qr.shortCode}`;

    res.json({
      success: true,
      data: {
        id: qr.id,
        title: qr.title,
        description: qr.description,
        targetUrl: qr.targetUrl,
        shortCode: qr.shortCode,
        dynamicUrl,
        qrType: qr.qrType,
        category: qr.category,
        designConfig: qr.designConfig,
        scanCount: qr.scanCount,
        createdAt: qr.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public QR details' });
  }
});

module.exports = router;
