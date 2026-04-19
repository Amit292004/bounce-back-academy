fetch('http://localhost:3000/api/admin/branding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ adMessage: "Test ad", adImageUrl: "http://test.com/image.png" })
}).then(res => res.text()).then(console.log).catch(console.error);
