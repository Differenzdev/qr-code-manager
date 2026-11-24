const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Support cloud providers if environment variables are set
let redisClient = null;
if (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) {
  try {
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
    });
    console.log('[DB] Configured cloud Upstash / Vercel KV storage.');
  } catch (err) {
    console.warn('[DB] Upstash initialization warning:', err.message);
  }
}

// Data directory path: if in serverless environment, use /tmp or fallback
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = isServerless 
  ? path.join('/tmp', 'qr_data') 
  : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'qrcode_db.json');

// Ensure local directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem fallback
}

// In-memory state backed by persistent store
let db = {
  users: [],
  qrcodes: [],
  scans: []
};

// Seed default demo user and sample QR codes
function getInitialSeed() {
  const salt = bcrypt.genSaltSync(10);
  const demoPasswordHash = bcrypt.hashSync('demo1234', salt);

  const demoUser = {
    id: 'user_demo_001',
    name: 'Alex Johnson',
    email: 'demo@example.com',
    passwordHash: demoPasswordHash,
    createdAt: new Date().toISOString()
  };

  const sampleQRs = [
    {
      id: 'qr_c304ca67-0',
      userId: demoUser.id,
      title: 'Monginis',
      description: 'Google Maps review & location link',
      targetUrl: 'https://www.google.com/maps/place/Monginis+Cake+Shop/@21.2071086,72.7684927,675m/data=!3m2!1e3!5s0x3be04c45e53184a9:0x12fcf9182673730c!4m12!1m2!2m1!1sMonginis+Cake+Shop!3m8!1s0x3be04c45b73ed34f:0x8fb779a62f01ef43!8m2!3d21.2071086!4d72.7729988!9m1!1b1!15sChJNb25naW5pcyBDYWtlIFNob3AiA4gBAVoUIhJtb25naW5pcyBjYWtlIHNob3CSAQljYWtlX3Nob3DgAQA!16s%2Fg%2F11b7xy4hhg?entry=ttu&g_ep=EgoyMDI2MTExOC4xIKXMDSoASAFQAw%3D%3D',
      shortCode: 'yrz6od',
      qrType: 'direct',
      category: 'Marketing',
      tags: ['review', 'google-maps', 'monginis'],
      designConfig: {
        fgColor: '#000000',
        bgColor: '#ffffff',
        level: 'M',
        margin: 2,
        size: 256
      },
      scanCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'qr_sample_001',
      userId: demoUser.id,
      title: 'Company Website Homepage',
      description: 'Official corporate website link for marketing brochures',
      targetUrl: 'https://example.com/company',
      shortCode: 'comp-web',
      qrType: 'direct',
      category: 'Marketing',
      tags: ['website', 'corporate', 'marketing'],
      designConfig: {
        fgColor: '#1e3a8a',
        bgColor: '#ffffff',
        level: 'H',
        margin: 2,
        size: 256
      },
      scanCount: 142,
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'qr_sample_002',
      userId: demoUser.id,
      title: 'Product Catalog PDF Download',
      description: 'Direct link to latest 2026 digital product catalog and price list',
      targetUrl: 'https://example.com/catalog-2026.pdf',
      shortCode: 'cat-2026',
      qrType: 'direct',
      category: 'Product',
      tags: ['catalog', 'pdf', 'pricing'],
      designConfig: {
        fgColor: '#047857',
        bgColor: '#f0fdf4',
        level: 'Q',
        margin: 3,
        size: 256
      },
      scanCount: 89,
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'qr_sample_003',
      userId: demoUser.id,
      title: 'Contact & Portfolio Linktree',
      description: 'Personal social handles, GitHub, and portfolio showcase',
      targetUrl: 'https://portfolio.example.com/alex',
      shortCode: 'alex-folio',
      qrType: 'direct',
      category: 'Personal',
      tags: ['portfolio', 'contact', 'bio'],
      designConfig: {
        fgColor: '#7c3aed',
        bgColor: '#faf5ff',
        level: 'M',
        margin: 2,
        size: 256
      },
      scanCount: 35,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ];

  return { users: [demoUser], qrcodes: sampleQRs, scans: [] };
}

// Load database from disk or cloud
async function loadDB() {
  // 1. Try Cloud KV / Redis if configured
  if (redisClient) {
    try {
      const cloudData = await redisClient.get('qr_manager_database');
      if (cloudData && typeof cloudData === 'object') {
        db = {
          users: Array.isArray(cloudData.users) ? cloudData.users : [],
          qrcodes: Array.isArray(cloudData.qrcodes) ? cloudData.qrcodes : [],
          scans: Array.isArray(cloudData.scans) ? cloudData.scans : []
        };
        console.log(`[DB] Loaded ${db.users.length} users and ${db.qrcodes.length} QR codes from Vercel KV`);
        return;
      } else {
        // Initialize cloud store with seed
        db = getInitialSeed();
        await redisClient.set('qr_manager_database', db);
        console.log('[DB] Seeded initial data to Vercel KV');
        return;
      }
    } catch (err) {
      console.warn('[DB] Error loading from cloud KV, falling back to disk/seed:', err.message);
    }
  }

  // 2. Local disk fallback
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      db = {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        qrcodes: Array.isArray(parsed.qrcodes) ? parsed.qrcodes : [],
        scans: Array.isArray(parsed.scans) ? parsed.scans : []
      };
      console.log(`[DB] Loaded ${db.users.length} users and ${db.qrcodes.length} QR codes from ${DB_FILE}`);
    } else {
      db = getInitialSeed();
      saveDB();
    }
  } catch (err) {
    console.error('[DB] Error loading database file, initializing default:', err);
    db = getInitialSeed();
    saveDB();
  }
}

// Persist database changes to disk and/or cloud
async function saveDB() {
  // Sync to Cloud KV if available
  if (redisClient) {
    try {
      await redisClient.set('qr_manager_database', db);
    } catch (err) {
      console.warn('[DB] Failed to sync to cloud KV:', err.message);
    }
  }

  // Sync to local disk
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    // If running in a read-only serverless environment without cloud KV
    if (!isServerless) {
      console.error('[DB] Error persisting database to disk:', err);
    }
  }
}

// Initial load
loadDB();

module.exports = {
  // User operations
  findUserByEmail(email) {
    if (!email) return null;
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUserById(id) {
    if (!id) return null;
    return db.users.find(u => u.id === id) || null;
  },

  createUser({ id, name, email, passwordHash }) {
    const newUser = {
      id,
      name,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDB();
    return newUser;
  },

  // QR Code operations
  getQRCodes(userId, filters = {}) {
    let list = db.qrcodes.filter(qr => qr.userId === userId);

    const { search, category, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(qr => 
        (qr.title && qr.title.toLowerCase().includes(q)) ||
        (qr.targetUrl && qr.targetUrl.toLowerCase().includes(q)) ||
        (qr.description && qr.description.toLowerCase().includes(q)) ||
        (Array.isArray(qr.tags) && qr.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (category && category !== 'All') {
      list = list.filter(qr => qr.category && qr.category.toLowerCase() === category.toLowerCase());
    }

    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'title') {
        valA = (a.title || '').toLowerCase();
        valB = (b.title || '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (sortBy === 'scanCount') {
        return sortOrder === 'asc' ? (a.scanCount || 0) - (b.scanCount || 0) : (b.scanCount || 0) - (a.scanCount || 0);
      }
      // default date
      valA = new Date(valA || 0).getTime();
      valB = new Date(valB || 0).getTime();
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  },

  getQRCodeById(id, userId = null) {
    const item = db.qrcodes.find(qr => qr.id === id);
    if (!item) return null;
    if (userId && item.userId !== userId) return null;
    return item;
  },

  getQRCodeByShortCode(shortCode) {
    if (!shortCode) return null;
    return db.qrcodes.find(qr => qr.shortCode === shortCode) || null;
  },

  createQRCode(data) {
    const newQR = {
      id: data.id,
      userId: data.userId,
      title: data.title || 'Untitled QR Code',
      description: data.description || '',
      targetUrl: data.targetUrl, // Permanently stored association
      shortCode: data.shortCode,
      qrType: data.qrType || 'direct', // Default to Direct URL for phone camera compatibility
      category: data.category || 'General',
      tags: Array.isArray(data.tags) ? data.tags : [],
      designConfig: data.designConfig || {
        fgColor: '#000000',
        bgColor: '#ffffff',
        level: 'M',
        margin: 2,
        size: 256
      },
      scanCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.qrcodes.unshift(newQR);
    saveDB();
    return newQR;
  },

  updateQRCode(id, userId, updates) {
    const index = db.qrcodes.findIndex(qr => qr.id === id && qr.userId === userId);
    if (index === -1) return null;

    const current = db.qrcodes[index];
    const updated = {
      ...current,
      ...updates,
      id: current.id,
      userId: current.userId,
      shortCode: updates.shortCode || current.shortCode,
      updatedAt: new Date().toISOString()
    };

    db.qrcodes[index] = updated;
    saveDB();
    return updated;
  },

  deleteQRCode(id, userId) {
    const index = db.qrcodes.findIndex(qr => qr.id === id && qr.userId === userId);
    if (index === -1) return false;
    db.qrcodes.splice(index, 1);
    saveDB();
    return true;
  },

  recordScan(shortCode, clientInfo = {}) {
    const qr = db.qrcodes.find(item => item.shortCode === shortCode);
    if (qr) {
      qr.scanCount = (qr.scanCount || 0) + 1;
      const scanEntry = {
        id: 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        qrCodeId: qr.id,
        shortCode,
        timestamp: new Date().toISOString(),
        userAgent: clientInfo.userAgent || 'unknown',
        ip: clientInfo.ip || '127.0.0.1'
      };
      db.scans.push(scanEntry);
      saveDB();
      return qr;
    }
    return null;
  },

  getStats(userId) {
    const userQRs = db.qrcodes.filter(qr => qr.userId === userId);
    const totalQRs = userQRs.length;
    const totalScans = userQRs.reduce((acc, curr) => acc + (curr.scanCount || 0), 0);
    const categories = Array.from(new Set(userQRs.map(qr => qr.category || 'General')));
    const dynamicQRs = userQRs.filter(qr => qr.qrType === 'dynamic').length;
    const directQRs = userQRs.filter(qr => qr.qrType === 'direct').length;

    return {
      totalQRs,
      totalScans,
      categoriesCount: categories.length,
      categories,
      dynamicQRs,
      directQRs
    };
  }
};
