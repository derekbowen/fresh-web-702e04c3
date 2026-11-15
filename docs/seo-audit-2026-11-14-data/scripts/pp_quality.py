import json,re,collections
W={'zero':0,'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19,'twenty':20}
rows={}
for l in open('texts.jsonl'):
    r=json.loads(l)
    if '/public-pools/' in r['url']: rows[r['url']]=r
def parts(u): return [p for p in u.split('/public-pools/')[1].strip('/').split('/') if p]
state=[u for u in rows if len(parts(u))==1]; city=[u for u in rows if len(parts(u))==2]; pool=[u for u in rows if len(parts(u))==3]
out={}
# state pages
zero_city=0; st_with_zero=0; tot_city_rows=0
for u in state:
    t=rows[u]['text']
    m=re.findall(r'(\d+) public pools?\b',t)
    z=sum(1 for x in m if x=='0'); zero_city+=z; tot_city_rows+=len(m); st_with_zero+= z>0
out['state_pages']=len(state); out['state_city_rows']=tot_city_rows; out['state_city_rows_zero']=zero_city; out['states_listing_zero_city']=st_with_zero
# city pages
mis_links=0; mis_prose=0; has_prose=0; hdr_ne_all=0; examples=[]; zero_hdr=0; small=collections.Counter(); nopriv=0
for u in city:
    t=rows[u]['text']; base=u.split('poolrentalnearme.com')[1]
    m=re.search(r'There (?:are|is) (\d+) public swimming pools?',t)
    hdr=int(m.group(1)) if m else None
    m2=re.search(r'All (\d+) public pools? in',t); alln=int(m2.group(1)) if m2 else None
    nlinks=len({l for l in rows[u]['links'] if l.startswith(base) and l.rstrip('/')!=base.rstrip('/')})
    if hdr is None: zero_hdr+=1
    if hdr is not None and alln is not None and hdr!=alln: hdr_ne_all+=1
    if hdr is not None and nlinks!=hdr: mis_links+=1
    pm=re.findall(r'(?:lists?|listing|have|has|found|features?|covers?|includes?|shows?|counts?|with|are|of)\s+(?:about |around |just |only |over |roughly |at least )?(\d+|'+'|'.join(W)+r')\s+(?:public |municipal |city |community |different |local )*(?:swimming )?pools?\b',t,flags=re.I)
    nums={int(x) if x.isdigit() else W[x.lower()] for x in pm}
    body={n for n in nums if n!=hdr}
    if nums: has_prose+=1
    if hdr is not None and body:
        mis_prose+=1
        if len(examples)<6: examples.append((base,hdr,sorted(body)))
    if hdr is not None: small['1' if hdr==1 else '2' if hdr==2 else '3-4' if hdr<=4 else '5+']+=1
    if re.search(r'No private pools are listed',t): nopriv+=1
out.update(city_pages=len(city),city_no_header_count=zero_hdr,city_header_vs_allN_mismatch=hdr_ne_all,city_header_vs_links_mismatch=mis_links,city_prose_with_count=has_prose,city_prose_count_contradicts_header=mis_prose,city_examples=examples,city_size=dict(small),city_no_private=nopriv)
# pool pages
rawjson=0; nohours=0; firstperson=0; norating=0; nameby=collections.defaultdict(list); verify=0; words=[]
for u in pool:
    t=rows[u]['text']
    if re.search(r'Best for: \[\s*"',t) or re.search(r'\["[a-z][^\]]{3,80}"\]',t): rawjson+=1
    if "hours aren't available" in t or 'hours are not available' in t.lower(): nohours+=1
    if re.search(r"\b(I hear|I'd suggest|I would suggest|My information|I don't have|I'd recommend|I recommend|I think|In my experience|I've seen|I get asked)\b",t): firstperson+=1
    if not re.search(r'\d\.\d★',t): norating+=1
    if 'verify current rates' in t: verify+=1
    p=parts(u); nameby[(p[0],p[2])].append(u); words.append(len(t.split()))
h1=collections.Counter()
for u in pool:
    t=rows[u]['text']; m=re.search(r'› ([^›]+?) \1 ',t)
dupname=collections.Counter()
for u in pool:
    p=parts(u); dupname[(p[0],re.sub(r'-(\d+|[a-z]+-[a-z]{2})$','',p[2]))]+=1
out.update(pool_pages=len(pool),pool_raw_json_array=rawjson,pool_no_hours=nohours,pool_first_person_voice=firstperson,pool_no_rating=norating,pool_verify_rates=verify,pool_same_slug_other_city=sum(1 for k,v in nameby.items() if len(v)>1), pool_same_slug_urls=sum(len(v) for v in nameby.values() if len(v)>1))
ex=[v for v in nameby.values() if len(v)>1][:4]
out['pool_same_slug_examples']=[[x.split('/public-pools/')[1] for x in v] for v in ex]
# city first-person too
out['city_first_person_voice']=sum(1 for u in city if re.search(r"\b(We get|Our public pools|Our site|we're lucky|I hear|I'd suggest|My information|around here|folks here)\b",rows[u]['text']))
json.dump(out,open('pp_quality.json','w'),indent=1)
for k,v in out.items(): print(k,':',v)
