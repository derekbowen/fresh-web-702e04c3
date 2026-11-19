# Independent expectation for body-links.sql, in Python's re (not PostgreSQL's): which pages change,
# how many links, and the exact new text. Pages in scope: published after apply.sql (the 29 dups are
# redirects by then). Usage: expect_bodies.py seed.json counts|changed|dump
import json, re, sys
d = json.load(open(sys.argv[1]))
dups = {dup: keep for dup, keep in d['pairs']}
status = dict(d['rows'])
for dup in dups: status[dup] = 'redirect'
def rewrite(text):
    if text is None: return None, 0
    n = 0
    for dup in sorted(dups):
        text, k = re.subn('/p/' + re.escape(dup) + '(?![a-z0-9-])', '/p/' + dups[dup], text)
        n += k
    return text, n
pages = links = 0; out = []
for slug, (md, html) in sorted(d['bodies'].items()):
    if status[slug] == 'published':
        md2, a = rewrite(md); html2, b = rewrite(html)
    else:
        md2, html2, a, b = md, html, 0, 0
    if a + b: pages += 1; links += a + b
    out.append('%s|%s|%s' % (slug, md2 if md2 is not None else '∅', html2 if html2 is not None else '∅'))
changed = [slug for slug, (md, html) in sorted(d['bodies'].items())
           if status[slug] == 'published' and (rewrite(md)[1] + rewrite(html)[1])]
if sys.argv[2] == 'counts': print(pages, links)
elif sys.argv[2] == 'changed': print('\n'.join(changed))
else: print('\n'.join(out))
