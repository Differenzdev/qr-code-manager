const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let vercelBlob = null;
try {
  vercelBlob = require('@vercel/blob');
} catch (e) {
  // Not in blob environment
}

const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless 
  ? path.join('/tmp', 'qr_data') 
  : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'qrcode_db.json');

// Ensure local directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {}

// In-memory state backed by persistent store
let db = {
  isInitialized: true,
  users: [],
  qrcodes: [],
  scans: []
};

// Clean initial data - ONLY real user data, ZERO dummy codes
function getCleanSeed() {
  const salt = bcrypt.genSaltSync(10);
  const demoPasswordHash = bcrypt.hashSync('demo1234', salt);

  const demoUser = {
    id: 'user_demo_001',
    name: 'Alex Johnson',
    email: 'demo@example.com',
    passwordHash: demoPasswordHash,
    createdAt: new Date().toISOString()
  };

  // Only real user QR code (Monginis), NO dummy samples!
  const realQRs = [
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
    }
  ];

  return {
    isInitialized: true,
    users: [demoUser],
    qrcodes: realQRs,
    scans: []
  };
}

// Track sync status
let isLoaded = false;
let loadPromise = null;

// Load database from cloud (Vercel Blob) or local disk
async function loadDB() {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // 1. Try Vercel Blob cloud storage
    if (vercelBlob && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { list } = vercelBlob;
        const blobs = await list({ prefix: 'qr_system_database.json' });
        if (blobs.blobs && blobs.blobs.length > 0) {
          const downloadUrl = blobs.blobs[0].downloadUrl;
          // Add timestamp cache buster
          const res = await fetch(`${downloadUrl}?t=${Date.now()}`, { cache: 'no-store' });
          if (res.ok) {
            const cloudData = await res.json();
            if (cloudData && typeof cloudData === 'object') {
              db = {
                isInitialized: true,
                users: Array.isArray(cloudData.users) ? cloudData.users : [],
                qrcodes: Array.isArray(cloudData.qrcodes) ? cloudData.qrcodes : [],
                scans: Array.isArray(cloudData.scans) ? cloudData.scans : []
              };
              console.log(`[DB Cloud] Successfully loaded ${db.qrcodes.length} QR codes from Vercel Blob!`);
              isLoaded = true;
              return db;
            }
          }
        }
      } catch (err) {
        console.warn('[DB Cloud] Warning loading from Vercel Blob:', err.message);
      }
    }

    // 2. Try Local disk file
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        db = {
          isInitialized: true,
          users: Array.isArray(parsed.users) ? parsed.users : [],
          qrcodes: Array.isArray(parsed.qrcodes) ? parsed.qrcodes : [],
          scans: Array.isArray(parsed.scans) ? parsed.scans : []
        };
        console.log(`[DB Local] Loaded ${db.qrcodes.length} QR codes from disk.`);
        isLoaded = true;
        return db;
      }
    } catch (err) {
      console.warn('[DB Local] Warning loading disk file:', err.message);
    }

    // 3. Fallback: Initialize clean seed
    db = getCleanSeed();
    isLoaded = true;
    await saveDB();
    return db;
  })();

  return loadPromise;
}

// Persist changes to Vercel Blob and local disk
async function saveDB() {
  // 1. Persist to Vercel Blob Cloud
  if (vercelBlob && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = vercelBlob;
      await put('qr_system_database.json', JSON.stringify(db, null, 2), {
        access: 'public',
        addRandomSuffix: false
      });
      console.log(`[DB Cloud] Persisted ${db.qrcodes.length} QR codes to Vercel Blob.`);
    } catch (err) {
      console.error('[DB Cloud] Error persisting to Vercel Blob:', err.message);
    }
  }

  // 2. Persist to local disk
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    if (!isServerless) {
      console.error('[DB Local] Error writing to disk:', err.message);
    }
  }
}

// Start loading immediately
loadDB();

module.exports = {
  // Ensure DB is ready before operations
  async ensureReady() {
    await loadDB();
  },

  // User operations
  async findUserByEmail(email) {
    await loadDB();
    if (!email) return null;
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id) {
    await loadDB();
    if (!id) return null;
    return db.users.find(u => u.id === id) || null;
  },

  async createUser({ id, name, email, passwordHash }) {
    await loadDB();
    const newUser = {
      id,
      name,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    await saveDB();
    return newUser;
  },

  // QR Code operations - SHARED across all users & browsers!
  async getQRCodes(userId, filters = {}) {
    await loadDB();

    // Return the SHARED collection of QR codes so all users/friends see all QR codes!
    let list = [...db.qrcodes];

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
      valA = new Date(valA || 0).getTime();
      valB = new Date(valB || 0).getTime();
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  },

  async getQRCodeById(id) {
    await loadDB();
    return db.qrcodes.find(qr => qr.id === id) || null;
  },

  async getQRCodeByShortCode(shortCode) {
    await loadDB();
    if (!shortCode) return null;
    return db.qrcodes.find(qr => qr.shortCode === shortCode) || null;
  },

  async createQRCode(data) {
    await loadDB();
    const newQR = {
      id: data.id,
      userId: data.userId,
      title: data.title || 'Untitled QR Code',
      description: data.description || '',
      targetUrl: data.targetUrl, // Permanently stored association
      shortCode: data.shortCode,
      qrType: data.qrType || 'direct', // Default to Direct URL for phone compatibility
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
    await saveDB();
    return newQR;
  },

  async updateQRCode(id, updates) {
    await loadDB();
    const index = db.qrcodes.findIndex(qr => qr.id === id);
    if (index === -1) return null;

    const current = db.qrcodes[index];
    const updated = {
      ...current,
      ...updates,
      id: current.id,
      shortCode: updates.shortCode || current.shortCode,
      updatedAt: new Date().toISOString()
    };

    db.qrcodes[index] = updated;
    await saveDB();
    return updated;
  },

  async deleteQRCode(id) {
    await loadDB();
    const index = db.qrcodes.findIndex(qr => qr.id === id);
    if (index === -1) return false;
    db.qrcodes.splice(index, 1);
    await saveDB();
    return true;
  },

  async recordScan(shortCode, clientInfo = {}) {
    await loadDB();
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
      await saveDB();
      return qr;
    }
    return null;
  },

  async getStats() {
    await loadDB();
    const totalQRs = db.qrcodes.length;
    const totalScans = db.qrcodes.reduce((acc, curr) => acc + (curr.scanCount || 0), 0);
    const categories = Array.from(new Set(db.qrcodes.map(qr => qr.category || 'General')));
    const dynamicQRs = db.qrcodes.filter(qr => qr.qrType === 'dynamic').length;
    const directQRs = db.qrcodes.filter(qr => qr.qrType === 'direct').length;

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
