const dns = require('dns');

const hosts = [
  'db.xupavgfnakjgeeqtcjpz.supabase.co',
  'aws-1-ap-southeast-2.pooler.supabase.com'
];

hosts.forEach(host => {
  dns.resolve4(host, (err, addresses) => {
    if (err) console.log(`IPv4 FAILED for ${host}:`, err.message);
    else console.log(`IPv4 for ${host}:`, addresses);
  });
  dns.resolve6(host, (err, addresses) => {
    if (err) console.log(`IPv6 FAILED for ${host}:`, err.message);
    else console.log(`IPv6 for ${host}:`, addresses);
  });
});
