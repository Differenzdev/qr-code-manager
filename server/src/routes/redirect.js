const express = require('express');
const router = express.Router();
const db = require('../db');

// Redirect endpoint for dynamic QR codes: /r/:shortCode
router.get('/:shortCode', (req, res) => {
  try {
    const { shortCode } = req.params;
    const clientInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'Unknown'
    };

    const qr = db.recordScan(shortCode, clientInfo);

    if (!qr || !qr.targetUrl) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>QR Code Link Not Found</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; text-align: center; max-width: 420px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
            h1 { color: #f43f5e; margin-bottom: 0.5rem; }
            p { color: #94a3b8; line-height: 1.5; }
            a { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>404 Not Found</h1>
            <p>The QR code you scanned is either invalid, expired, or has been removed by the creator.</p>
            <a href="/">Go to Home</a>
          </div>
        </body>
        </html>
      `);
    }

    // HTTP 302 redirect to the persistent target URL!
    return res.redirect(302, qr.targetUrl);
  } catch (err) {
    console.error('[Redirect Error]', err);
    res.status(500).send('Redirection error');
  }
});

module.exports = router;
