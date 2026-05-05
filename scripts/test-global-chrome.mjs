const BASE = process.env.BASE_URL || 'http://localhost:8080';
const ROUTES = [
  '/', '/directory', '/blog', '/academy', '/help-center',
  '/host-tools', '/landing-page', '/referral', '/pool-builders',
  '/p/how-it-works', '/p/hosting', '/p/earnings-calculator',
  '/p/free-host-tools', '/p/all-locations',
];

let failed = 0;
for (const path of ROUTES) {
  const res = await fetch(BASE + path, { redirect: 'manual' });
  const html = await res.text();
  // Site chrome markers: sticky header class + footer border-t
  const headerMatches = (html.match(/<header[^>]*sticky top-0 z-40/g) || []).length;
  const footerMatches = (html.match(/<footer[^>]*border-t border-border bg-background/g) || []).length;
  const status = res.status;
  const ok = (status >= 300 && status < 400) || (headerMatches === 1 && footerMatches === 1);
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${path}  status=${status}  header=${headerMatches}  footer=${footerMatches}`);
}
console.log(failed === 0 ? '\nALL PASSED' : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
