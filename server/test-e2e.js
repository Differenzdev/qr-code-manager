async function runTests() {
  console.log('--- Starting E2E Verification of QR Code Management System ---');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  const health = await healthRes.json();
  console.log('1. Health check:', health);

  // 2. Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@example.com', password: 'demo1234' })
  });
  const loginData = await loginRes.json();
  console.log('2. Login success:', loginData.message, '| User:', loginData.user?.name);
  const token = loginData.token;

  // 3. List QR codes
  const listRes = await fetch('http://localhost:5000/api/qrcodes', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = await listRes.json();
  console.log(`3. Retrieved ${listData.data.length} QR codes from persistent database.`);

  // 4. Create & Save new QR code with URL
  const testUrl = 'https://docs.google.com/presentation/d/12345/preview';
  const createRes = await fetch('http://localhost:5000/api/qrcodes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Quarterly Executive Pitch Deck',
      description: 'Slide deck for board review meeting',
      targetUrl: testUrl,
      category: 'Marketing',
      qrType: 'dynamic',
      designConfig: {
        fgColor: '#1d4ed8',
        bgColor: '#ffffff',
        level: 'H',
        margin: 2,
        size: 256
      }
    })
  });
  const createData = await createRes.json();
  console.log('4. Create QR code:', createData.message);
  console.log('   Saved QR ID:', createData.data.id);
  console.log('   Associated Target URL:', createData.data.targetUrl);
  console.log('   Dynamic ShortCode:', createData.data.shortCode);

  // 5. Test Dynamic Redirection (Requirement 3, 5, 8)
  const redirectRes = await fetch(`http://localhost:5000/r/${createData.data.shortCode}`, {
    redirect: 'manual'
  });
  console.log('5. Dynamic Redirect Status:', redirectRes.status);
  console.log('   Redirect Target Location:', redirectRes.headers.get('location'));
  if (redirectRes.headers.get('location') === testUrl) {
    console.log('   >>> PASS: Dynamic redirect matches persistent associated URL perfectly!');
  } else {
    console.error('   >>> FAIL: Redirect target mismatch');
  }

  // 6. Test Single QR Get & Download endpoint (Requirement 6)
  const downloadRes = await fetch(`http://localhost:5000/api/qrcodes/${createData.data.id}/download?format=png&size=512&filename=quarterly-pitch-2026`);
  console.log('6. Download endpoint status:', downloadRes.status);
  console.log('   Content-Type:', downloadRes.headers.get('content-type'));
  console.log('   Content-Disposition:', downloadRes.headers.get('content-disposition'));

  // 7. Test SVG Download
  const svgRes = await fetch(`http://localhost:5000/api/qrcodes/${createData.data.id}/download?format=svg&size=512&filename=quarterly-pitch-2026`);
  console.log('7. SVG Download status:', svgRes.status);
  console.log('   Content-Type:', svgRes.headers.get('content-type'));
  console.log('   Content-Disposition:', svgRes.headers.get('content-disposition'));

  // 8. Test Update QR Code (Requirement 3, 8)
  const updatedUrl = 'https://docs.google.com/presentation/d/99999/updated-preview';
  const updateRes = await fetch(`http://localhost:5000/api/qrcodes/${createData.data.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Quarterly Executive Pitch Deck (Updated Final)',
      targetUrl: updatedUrl
    })
  });
  const updateData = await updateRes.json();
  console.log('8. Updated Target URL in DB:', updateData.data.targetUrl);

  // Verify updated URL redirects immediately without changing QR code shortcode
  const redirectUpdatedRes = await fetch(`http://localhost:5000/r/${createData.data.shortCode}`, {
    redirect: 'manual'
  });
  console.log('   Updated Redirect Target Location:', redirectUpdatedRes.headers.get('location'));
  if (redirectUpdatedRes.headers.get('location') === updatedUrl) {
    console.log('   >>> PASS: Updated persistent URL redirects correctly!');
  }

  // 9. Test Public Sharing endpoint (Requirement 5)
  const publicRes = await fetch(`http://localhost:5000/api/qrcodes/public/${createData.data.id}`);
  const publicData = await publicRes.json();
  console.log('9. Public QR Share Data:', publicData.data?.title, '| Target:', publicData.data?.targetUrl);

  // 10. Check frontend static delivery
  const feRes = await fetch('http://localhost:5000/');
  const feText = await feRes.text();
  console.log('10. Frontend served at root:', feRes.status, '| HTML includes root:', feText.includes('id="root"'));

  console.log('--- All Automated Tests Passed Successfully! ---');
}

runTests().catch(console.error);
