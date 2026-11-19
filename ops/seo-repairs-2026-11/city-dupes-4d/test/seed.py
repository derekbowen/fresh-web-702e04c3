# Seed: the 29 dups and 28 keepers of pairs.sql, plus filler host pages in the same states (and others),
# 'become-a-pool-host-' twins, existing redirects, renter pages, NULL/tied impressions. Deterministic.
import re, random, sys
random.seed(19)
pairs = re.findall(r"\('([^']+)', '([^']+)'\)", open(sys.argv[1]).read())
assert len(pairs) == 29
rows = []
def host(slug, status='published', redirect=None, imp=None, tpl='host_acq_city', sitemap=True, url=None):
    rows.append((slug, tpl, status, redirect, sitemap, url if url is not None else '/p/' + slug, imp))
seen = set()
for dup, keep in pairs:
    if dup not in seen: host(dup, imp=random.choice([None, 0, 3, 50, 175])); seen.add(dup)
    if keep not in seen: host(keep, imp=random.choice([None, 0, 3, 50, 175])); seen.add(keep)
states = ['mo','id','ny','ma','pa','ct','al','nm','ks','tx','ca','fl','wa']
for i in range(260):
    st = states[i % len(states)]
    s = f'become-a-swimming-pool-host-town{i:03d}-{st}'
    host(s, imp=random.choice([None, 0, 0, 1, 2, 5, 9, 40, 120]))
for i in range(12):   # become-a-pool-host twins (excluded from eligible when the swimming twin is published)
    host(f'become-a-pool-host-town{i:03d}-{states[i % len(states)]}', imp=random.choice([None, 7, 300]))
for i in range(6):    # existing redirects
    host(f'become-a-swimming-pool-host-old{i}-tx', status='redirect', redirect=f'become-a-swimming-pool-host-town{i:03d}-ca', sitemap=False)
for i in range(5):    # drafts and renter pages
    host(f'become-a-swimming-pool-host-draft{i}-ca', status='draft')
    host(f'pool-rentals-city{i}-ca', tpl='renter_city', imp=10)
# Page text with links to dups (body_markdown on host pages, HTML content on a renter page), plus the
# look-alikes that must NOT change: keepers that extend a dup's slug, other host pages, a dup row's own
# text, a draft. Written to argv[2] as JSON so the test can compute the expected rewrite independently.
H = '/p/become-a-swimming-pool-host-'
bodies = {
  'become-a-swimming-pool-host-town001-id': ('[a](' + H + 'santa-fe) [b](' + H + 'santa-fe-nm) [c](' + H + 'santa-fe-new-mexico/) end', None),
  'become-a-swimming-pool-host-town002-ny': ('See https://www.poolrentalnearme.com' + H + 'buffalo#top and ' + H + 'buffalo-ny', None),
  'become-a-swimming-pool-host-town003-ma': ('Last link: ' + H + 'erie', None),
  'become-a-swimming-pool-host-town004-pa': ('[x](' + H + '-ofallon-mo) [y](' + H + 'ofallon-mo) [z](' + H + 'plano?ref=1) [w](' + H + 'plano-tx)', None),
  'become-a-swimming-pool-host-town005-ct': ('[h](' + H + 'hartford) twice [h2](' + H + 'hartford) and [nh](' + H + 'new-haven-ct) [nh2](' + H + 'new-haven)', None),
  'become-a-swimming-pool-host-town006-al': ('Only other host pages: [t](' + H + 'town007-nm) [e](' + H + 'erie-pa)', None),
  # Pages the related-slugs refresh also changes (both steps touch them; the undo must still be exact).
  'become-a-swimming-pool-host-town036-ca': ('Both steps: [lc](' + H + 'liguna-niguel-ca)', None),
  'become-a-swimming-pool-host-town030-pa': ('Both steps: [e](' + H + 'eastion-pa) and [e2](' + H + 'eastion-pa)', None),
  'pool-rentals-city0-ca': (None, '<p><a href="' + H + 'pasadena">Pasadena hosts</a> <a href="' + H + 'pasadena-ca">ok</a></p>'),
  'become-a-swimming-pool-host-cambridge': ('A dup row links another dup: ' + H + 'erie', None),
  'become-a-swimming-pool-host-draft0-ca': ('A draft links a dup: ' + H + 'mesquite', None),
}
if len(sys.argv) > 2:
    import json
    json.dump({'pairs': pairs, 'rows': [[r[0], r[2]] for r in rows], 'bodies': bodies}, open(sys.argv[2], 'w'))
def q(v):
    if v is None: return 'null'
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, int): return str(v)
    return "'" + v.replace("'", "''") + "'"
print('alter table public.content_pages disable trigger tg_host_acq_related_refresh;')
print('insert into public.content_pages (slug, template_type, status, redirect_to, in_sitemap, url_path, gsc_impressions) values')
print(',\n'.join('(' + ', '.join(q(x) for x in r) + ')' for r in rows) + ';')
for slug, (md, html) in bodies.items():
    print('update public.content_pages set body_markdown = %s, content = %s where slug = %s;' % (q(md), q(html), q(slug)))
print('alter table public.content_pages enable trigger tg_host_acq_related_refresh;')
print("select public.refresh_related_slugs_for_template('host_acq_city');")
print("update public.content_pages set updated_at = timestamptz '2026-11-15 19:05:00+00' + (random() * interval '1 day');")
