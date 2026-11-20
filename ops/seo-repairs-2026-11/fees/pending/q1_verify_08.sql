set transaction read only;
-- F14 pending verification batch 8: does each old_text occur exactly once in its row/column?
-- Returns: total, ok, and only the failing items (i = row index in q1_index.tsv).
with v(i,id,col,old,h) as (values
(1200,'3cef19ac-dec9-4e90-96ea-eb146bdd6d40'::uuid,'body_markdown',$f14$After each successful booking, your earnings, minus our 0% host fee, are processed securely and disbursed to you.$f14$,'6d67916ce8b72c484130552996d13bc4'),
(1201,'555681f7-4688-48e7-b932-4b78dac0328c'::uuid,'body_markdown',$f14$That means you keep the majority of what you earn and still get the support and protection of our marketplace.$f14$,'577780a30f9165e182e51b0d2716aaad'),
(1202,'7b6ec28f-bf6a-4551-9233-797e9996db8d'::uuid,'body_markdown',$f14$After our 0% fee (the lowest in the industry), the host takes home $810.$f14$,'eeea16c0cd0ae31a6890ffa4519be7e1'),
(1203,'7b6ec28f-bf6a-4551-9233-797e9996db8d'::uuid,'content',$f14$After our 0% fee (the lowest in the industry), the host takes home $810.$f14$,'eeea16c0cd0ae31a6890ffa4519be7e1'),
(1204,'6b0a60fb-66a9-412b-8800-fe4a54f86123'::uuid,'body_markdown',$f14$Even after our 0% host fee, you are left with over $1,000.$f14$,'e2813c1b063e44564f3798a4b16cd5da'),
(1205,'6b0a60fb-66a9-412b-8800-fe4a54f86123'::uuid,'content',$f14$Even after our 0% host fees, you are left with over $1,000.$f14$,'e6f2cd145a9ee73b8457599fb55a4f2f'),
(1206,'d27199e7-2091-4335-9fa6-0b3c7a2d3380'::uuid,'body_markdown',$f14$Hosting just three 3-hour sessions over a weekend generates over $400 (after fees).$f14$,'40e1fe5b4071b2c4e0af72f1f9cb2799'),
(1207,'d27199e7-2091-4335-9fa6-0b3c7a2d3380'::uuid,'content',$f14$Hosting just three 3-hour sessions over a weekend generates over $400 (after fees).$f14$,'40e1fe5b4071b2c4e0af72f1f9cb2799'),
(1208,'f1cc8d32-c69a-4e10-bb4e-ea85c81a7794'::uuid,'body_markdown',$f14$After the 0% fee on Pool Rental Near Me, you’re taking home $540.$f14$,'9e94960a0aec8e69b5b92aed78ecb251'),
(1209,'f1cc8d32-c69a-4e10-bb4e-ea85c81a7794'::uuid,'body_markdown',$f14$This extra 5%–10% margin compared to other platforms can add up to thousands of dollars over a few years—money that can be reinvested into your property to increase its value.$f14$,'135ac96ea27b2862b06981228ae787cc'),
(1210,'f1cc8d32-c69a-4e10-bb4e-ea85c81a7794'::uuid,'body_markdown',$f14$We believe that since you are the one doing the skimming, the scrubbing, and the hosting, you should keep the lion's share of the profit.$f14$,'35e65cd05dd3977b0c4facf29629e6f9'),
(1211,'f1cc8d32-c69a-4e10-bb4e-ea85c81a7794'::uuid,'content',$f14$After the 0% fee on Pool Rental Near Me, you’re taking home $540.$f14$,'9e94960a0aec8e69b5b92aed78ecb251'),
(1212,'f1cc8d32-c69a-4e10-bb4e-ea85c81a7794'::uuid,'content',$f14$This extra 5%–10% margin compared to other platforms can add up to thousands of dollars over a few years—money that can be reinvested into your property to increase its value.$f14$,'135ac96ea27b2862b06981228ae787cc'),
(1213,'f1cc8d32-c69a-4e10-bb4e-ea85c81a7794'::uuid,'content',$f14$We believe that since you are the one doing the skimming, the scrubbing, and the hosting, you should keep the lion's share of the profit.$f14$,'35e65cd05dd3977b0c4facf29629e6f9'),
(1214,'59f33aa6-e273-4c34-b270-04513571fc06'::uuid,'body_markdown',$f14$Even after our 0% host fee, you are looking at over $10,000 in profit.$f14$,'2278e308785715fbe71418bb139f2950'),
(1215,'59f33aa6-e273-4c34-b270-04513571fc06'::uuid,'content',$f14$Even after our 0% host fees, you are looking at over $10,000 in profit.$f14$,'0eb4d96c0bc541239d2f6af91ea23c1e'),
(1216,'1c0d664d-8cd1-44f5-ac56-75722b95bf2f'::uuid,'body_markdown',$f14$After the 0% fee, you’ve earned $360—enough to pay for an entire season's worth of pool chemicals or a high-end robot cleaner.$f14$,'6cde2fedaae6de6ba4c182a03c9778be'),
(1217,'1c0d664d-8cd1-44f5-ac56-75722b95bf2f'::uuid,'content',$f14$After the 0% fee, you’ve earned $360—enough to pay for an entire season's worth of pool chemicals or a high-end robot cleaner.$f14$,'6cde2fedaae6de6ba4c182a03c9778be'),
(1218,'20bf81d8-c445-4eb2-beef-b531dc30cf78'::uuid,'body_markdown',$f14$Whether that means buying new cushions for your patio furniture or upgrading to a variable-speed pump to save on electricity, that extra 5-10% adds up quickly over a New Jersey summer$f14$,'5a76db0b51a3231f77b3cd8e22f61dde'),
(1219,'20bf81d8-c445-4eb2-beef-b531dc30cf78'::uuid,'content',$f14$Whether that means buying new cushions for your patio furniture or upgrading to a variable-speed pump to save on electricity, that extra 5-10% adds up quickly over a New Jersey summer$f14$,'5a76db0b51a3231f77b3cd8e22f61dde'),
(1220,'889a1857-2fb0-4566-88d6-e7788ceab700'::uuid,'body_markdown',$f14$After accounting for the 0% host fee on Pool Rental Near Me, the owner is left with over $6,400 in profit.$f14$,'2324008da881778a73c7a33acfbc6d45'),
(1221,'889a1857-2fb0-4566-88d6-e7788ceab700'::uuid,'content',$f14$After accounting for the 0% host fees on Pool Rental Near Me, the owner is left with over $6,400 in profit.$f14$,'ac6a64caec909edd58791ace1fe9f058'),
(1222,'254529cb-c4e3-4612-9051-f85b144c86f4'::uuid,'body_markdown',$f14$The host fee of just 10% on Pool Rental Near Me is significantly lower than other platforms, meaning more of that$f14$,'0d58765e1483b8d3c30afe59763f4a90'),
(1223,'254529cb-c4e3-4612-9051-f85b144c86f4'::uuid,'body_markdown',$f14$Consider the math: A typical four-hour booking on a Saturday afternoon at $60/hour nets you $216 after the platform fee.$f14$,'19b81e6e3a6ff193debdaf56b483a369'),
(1224,'254529cb-c4e3-4612-9051-f85b144c86f4'::uuid,'content',$f14$The host fee of just 10% on Pool Rental Near Me is significantly lower than other platforms, meaning more of that$f14$,'0d58765e1483b8d3c30afe59763f4a90'),
(1225,'254529cb-c4e3-4612-9051-f85b144c86f4'::uuid,'content',$f14$Consider the math: A typical four-hour booking on a Saturday afternoon at $60/hour nets you $216 after the platform fee.$f14$,'19b81e6e3a6ff193debdaf56b483a369'),
(1226,'1bfce5d9-d0fa-46f5-a9b0-75f96500d858'::uuid,'body_markdown',$f14$The 10% fee is much better than what I've seen elsewhere too!"$f14$,'17167e8218cb3fbd95346259bc6d10e8'),
(1227,'c37d677c-fb01-4b4e-8ec2-e93f68b2eacc'::uuid,'body_markdown',$f14$We believe you should retain the majority of what you earn.$f14$,'9387ac13f7c35e1a8b54acf0ae8ed2b0')
),
j as (select v.*, (select count(*) from content_pages p where p.id=v.id) nid,
  (select case v.col when 'body_markdown' then p.body_markdown when 'content' then p.content when 'description' then p.description
   when 'seo_description' then p.seo_description when 'seo_title' then p.seo_title when 'og_description' then p.og_description when 'raw_html' then p.raw_html end
   from content_pages p where p.id=v.id) f from v),
o as (select i, nid, md5(old)=h hm, case when f is null then null else (length(f)-length(replace(f,old,'')))/length(old) end n from j)
select count(*) total, count(*) filter (where nid=1 and hm and n=1) ok,
  json_agg(json_build_object('i',i,'nid',nid,'n',n)) filter (where not (nid=1 and hm and coalesce(n,0)=1)) bad from o;
