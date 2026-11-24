async function testPersistenceAcrossBrowsers() {
  console.log('=== Testing Persistent URL Storage Across Browsers & Sessions ===\n');

  // STEP 1: Simulate "Browser 1" (Chrome on Windows)
  console.log('[Browser 1 - Chrome Windows] User logs in and creates a persistent QR code...');
  const loginBrowser1 = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    },
    body: JSON.stringify({ email: 'demo@example.com', password: 'demo1234' })
  });
  const data1 = await loginBrowser1.json();
  const token1 = data1.token;

  // Add QR Code with unique test URL
  const testUrl = 'https://mypermanentbusiness.com/annual-report-2026';
  const createRes = await fetch('http://localhost:5000/api/qrcodes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0'
    },
    body: JSON.stringify({
      title: 'Annual Business Report 2026',
      targetUrl: testUrl,
      category: 'Product',
      qrType: 'dynamic'
    })
  });
  const createdQR = (await createRes.json()).data;
  console.log(`[Browser 1] QR Code created with ID: ${createdQR.id}`);
  console.log(`[Browser 1] Associated URL permanently stored: ${createdQR.targetUrl}\n`);

  // STEP 2: Simulate Browser 1 completely closed, user logged out, cache purged
  console.log('--- User closes Browser 1, leaves for an extended period, clears client storage ---');
  // (All client-side state is discarded)

  // STEP 3: Simulate "Browser 2" (Safari on iOS / Firefox on Linux) logging in afresh
  console.log('[Browser 2 - Safari iOS] User opens a completely different browser and logs in...');
  const loginBrowser2 = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    },
    body: JSON.stringify({ email: 'demo@example.com', password: 'demo1234' })
  });
  const data2 = await loginBrowser2.json();
  const token2 = data2.token;

  // Fetch QR codes from Browser 2
  const listRes = await fetch('http://localhost:5000/api/qrcodes', {
    headers: {
      'Authorization': `Bearer ${token2}`,
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1) Safari/604.1'
    }
  });
  const list2 = await listRes.json();
  const foundQR = list2.data.find(q => q.id === createdQR.id);

  if (!foundQR) {
    throw new Error('FAIL: QR code not found on Browser 2!');
  }

  if (foundQR.targetUrl !== testUrl) {
    throw new Error(`FAIL: Target URL mismatch! Expected ${testUrl}, got ${foundQR.targetUrl}`);
  }

  console.log(`[Browser 2] SUCCESS: Retrieved QR Code "${foundQR.title}"`);
  console.log(`[Browser 2] SUCCESS: Associated URL is intact: "${foundQR.targetUrl}"\n`);

  // STEP 4: Verify external scan from any third-party device redirects to the persistent URL
  console.log('[External Scanner] Third party scans the QR code without being logged in...');
  const scanRedirect = await fetch(`http://localhost:5000/r/${foundQR.shortCode}`, {
    redirect: 'manual',
    headers: { 'User-Agent': 'QR-Scanner-App/2.4' }
  });

  const redirectedLocation = scanRedirect.headers.get('location');
  console.log(`[External Scanner] HTTP Status: ${scanRedirect.status}`);
  console.log(`[External Scanner] Redirect Target: ${redirectedLocation}`);

  if (redirectedLocation === testUrl) {
    console.log('\n>>> PERSISTENCE VERIFICATION PASSED: Associated URL is permanently preserved and functioning! <<<');
  } else {
    throw new Error('FAIL: Redirection destination does not match target URL');
  }
}

testPersistenceAcrossBrowsers().catch(err => {
  console.error('Persistence Test Error:', err);
  process.exit(1);
});
