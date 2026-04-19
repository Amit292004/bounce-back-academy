const fetch = require('node-fetch');

async function testAnalytics() {
  try {
    const res = await fetch('http://localhost:3000/api/analytics');
    const data = await res.json();
    console.log('Analytics Data:', data);
  } catch (err) {
    console.error('Error fetching analytics:', err.message);
  }
}

testAnalytics();
