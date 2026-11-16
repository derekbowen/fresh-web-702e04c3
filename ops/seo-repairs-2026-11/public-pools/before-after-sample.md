# Public-pools text cleaner: before / after sample

> **Data source: SURROGATE, NOT PRODUCTION.** The production dry run could not be run on 2026-11-16 (database tool unavailable; PR-6 in [PENDING-READS.md](PENDING-READS.md)). The rows below are real text: the fields of the live pages fetched read-only on **2026-11-16** (2,000 pool and 476 city pages of the saved sitemap), which equalled the production extract of 2026-11-15 byte for byte wherever compared. They were loaded into a throwaway local PostgreSQL 16 table and run through the SAME SQL as dry-run.sql (core md5 `88e17e31d9d9842a9975f666fd1f02bc`). The 15 fields per rule were chosen in the database with the dry run's own seeded selection (`order by md5(row_id || col || '2026-11-15')`, row ids being local md5s of the page URL). The production dry run prints the same section (section 4) on production rows; **that** is the sample to approve. Whether pp-ssr reads this database live is **UNVERIFIED**.

Every change below either deletes whole sentences, deletes whole FAQ entries, or re-joins an existing list (R1). No word is added or reworded. Rules: [rules.json](rules.json), [TEXT-DEFECTS.md](TEXT-DEFECTS.md); field-level additions A1-A4: [RUNBOOK.md](RUNBOOK.md) section 3.

## Totals on the surrogate (2,476 live pages, 2026-11-16)

| Table | Column | Rules | Fields changed |
|---|---|---|---|
| pp_cities | ai_faqs | R4 | 31 |
| pp_cities | ai_faqs | R6 | 1 |
| pp_cities | ai_intro | R4 | 136 |
| pp_cities | ai_intro | R6 | 9 |
| pp_cities | ai_intro | R6+R4 | 1 |
| pp_pools | ai_best_for | R1 | 1,678 |
| pp_pools | ai_description | R2 | 210 |
| pp_pools | ai_faqs | R3 | 622 |
| pp_pools | ai_faqs | R5 | 40 |
| pp_pools | ai_faqs | R5+R3 | 18 |
| | | **total** | **2,746** |

Fields skipped (a rule would have changed them, a skip condition stopped it), by reason:

| Skip | Fields |
|---|---|
| `R3:next_sentence_refers_back` | 212 |
| `R2:next_sentence_refers_back` | 182 |
| `R4:next_sentence_refers_back` | 61 |
| `ALL:insurance_anywhere` | 39 |
| `R3:deleted_sentence_names_an_entity` | 26 |
| `R4:deleted_sentence_names_an_entity` | 14 |
| `ALL:insurance` | 9 |
| `R3:below_min_length` | 9 |
| `R2:deleted_sentence_names_an_entity` | 8 |
| `R1:empty_list` | 7 |
| `R6:next_sentence_refers_back` | 5 |
| `R2:next_sentence_refers_back_a5` | 2 |
| `R6:next_sentence_refers_back_a5` | 2 |

## R1: Best-for JSON array becomes a plain list

15 of 1,678 fields carrying R1.

### R1.1 `pp_pools.ai_best_for` /public-pools/texas/dallas/margaret-young-natatorium-at-farmers-branch-aquatics-center/ (rules applied to this field: R1)

Before:

> ["lap swimmers", "fitness swimmers", "year-round swimming", "casual recreation"]

After:

> lap swimmers, fitness swimmers, year-round swimming, casual recreation

### R1.2 `pp_pools.ai_best_for` /public-pools/texas/houston/evergreen-and-elaine-wood-therapy-pool-complex/ (rules applied to this field: R1)

Before:

> ["fitness swimmers", "seniors", "accessibility needs", "year-round swimming"]

After:

> fitness swimmers, seniors, accessibility needs, year-round swimming

### R1.3 `pp_pools.ai_best_for` /public-pools/new-jersey/clifton/clifton-ymca-pool/ (rules applied to this field: R1)

Before:

> ["lap swimmers", "fitness swimmers", "year-round swimming", "families"]

After:

> lap swimmers, fitness swimmers, year-round swimming, families

### R1.4 `pp_pools.ai_best_for` /public-pools/texas/austin/east-communities-ymca/ (rules applied to this field: R1)

Before:

> ["families", "lap swimmers", "fitness swimmers", "year-round swimming"]

After:

> families, lap swimmers, fitness swimmers, year-round swimming

### R1.5 `pp_pools.ai_best_for` /public-pools/texas/dallas/robson-lindley-aquatics-center-and-barr-mcmillion-natatorium/ (rules applied to this field: R1)

Before:

> ["lap swimmers", "fitness swimmers", "year-round swimming"]

After:

> lap swimmers, fitness swimmers, year-round swimming

### R1.6 `pp_pools.ai_best_for` /public-pools/oregon/eugene/glass-bar-nude-beach/ (rules applied to this field: R1)

Before:

> ["casual recreation"]

After:

> casual recreation

### R1.7 `pp_pools.ai_best_for` /public-pools/pennsylvania/lancaster/lancaster-municipal-pool/ (rules applied to this field: R1)

Before:

> ["lap swimmers", "fitness swimmers", "seniors", "year-round swimming"]

After:

> lap swimmers, fitness swimmers, seniors, year-round swimming

### R1.8 `pp_pools.ai_best_for` /public-pools/florida/cape-coral/cape-coral-aquatic-center/ (rules applied to this field: R1)

Before:

> ["families", "lap swimmers", "fitness swimmers", "year-round swimming"]

After:

> families, lap swimmers, fitness swimmers, year-round swimming

### R1.9 `pp_pools.ai_best_for` /public-pools/california/san-francisco/north-beach-pool/ (rules applied to this field: R1)

Before:

> ["lap swimmers", "fitness swimmers", "casual recreation"]

After:

> lap swimmers, fitness swimmers, casual recreation

### R1.10 `pp_pools.ai_best_for` /public-pools/california/san-francisco/glen-park-recreation-center/ (rules applied to this field: R1)

Before:

> ["families", "lap swimmers", "casual recreation", "fitness swimmers"]

After:

> families, lap swimmers, casual recreation, fitness swimmers

### R1.11 `pp_pools.ai_best_for` /public-pools/texas/richardson/richardson-family-ymca/ (rules applied to this field: R1)

Before:

> ["families", "lap swimmers", "fitness swimmers", "year-round swimming"]

After:

> families, lap swimmers, fitness swimmers, year-round swimming

### R1.12 `pp_pools.ai_best_for` /public-pools/california/escondido/rod-mcleod-pool/ (rules applied to this field: R1)

Before:

> ["families", "lap swimmers", "casual recreation", "summer cooldown"]

After:

> families, lap swimmers, casual recreation, summer cooldown

### R1.13 `pp_pools.ai_best_for` /public-pools/michigan/detroit/ford-woods-swimming-pool-detroit/ (rules applied to this field: R1)

Before:

> ["families", "casual recreation", "summer cooldown"]

After:

> families, casual recreation, summer cooldown

### R1.14 `pp_pools.ai_best_for` /public-pools/texas/houston/stude-swimming-pool/ (rules applied to this field: R1)

Before:

> ["families", "casual recreation", "summer cooldown"]

After:

> families, casual recreation, summer cooldown

### R1.15 `pp_pools.ai_best_for` /public-pools/wisconsin/madison/goodman-pool/ (rules applied to this field: R1)

Before:

> ["families", "toddlers", "casual recreation", "summer cooldown"]

After:

> families, toddlers, casual recreation, summer cooldown

## R2: narrator sentences in pool descriptions

15 of 210 fields carrying R2.

### R2.1 `pp_pools.ai_description` /public-pools/indiana/indianapolis/gustafson-park-outdoor-pool/ (rules applied to this field: R2)

Before:

> Gustafson Park pool sounds like a decent public option in Indianapolis. They've got solid hours, opening at 11 AM most days and staying open until 8 PM on Tuesdays and Fridays, which is nice if you want an evening swim. Sundays are a bit later, 12 PM to 6 PM. It's got a 4.2-star rating from over eighty people, so that tells me it's generally well-liked. With Indianapolis being a big city (almost 900,000 folks), having spots like this matters. It's on Moller Road, pretty straightforward to find. I'd say it's probably standard public pool stuff, good for a casual dip or taking the kids to cool off. Just make sure to check their website or give them a call, especially since Mondays are a no-go.

After:

> Gustafson Park pool sounds like a decent public option in Indianapolis. They've got solid hours, opening at 11 AM most days and staying open until 8 PM on Tuesdays and Fridays, which is nice if you want an evening swim. Sundays are a bit later, 12 PM to 6 PM. It's got a 4.2-star rating from over eighty people, so that tells me it's generally well-liked. With Indianapolis being a big city (almost 900,000 folks), having spots like this matters. It's on Moller Road, pretty straightforward to find. Just make sure to check their website or give them a call, especially since Mondays are a no-go.

Deleted sentence(s):

- “I'd say it's probably standard public pool stuff, good for a casual dip or taking the kids to cool off.”

### R2.2 `pp_pools.ai_description` /public-pools/georgia/decatur/decatur-aquatic-center/ (rules applied to this field: R2)

Before:

> Honestly, the Decatur Aquatic Center sounds like a solid choice if you're in the area. It's an outdoor pool, which is great for summer. It's got a 4.5 star rating from 115 reviews, so people generally like it. For five bucks for adults and three for kids, it's pretty affordable too. They've got lap lanes if you're trying to get some exercise in, plus picnic areas and shade structures. That's always a plus when you're spending a few hours outside. It's in Decatur, GA, which isn't a huge city (around 25,000 people), so it might not be as overwhelmingly crowded as some bigger spots. I'd definitely consider it for a casual swim day.

After:

> Honestly, the Decatur Aquatic Center sounds like a solid choice if you're in the area. It's an outdoor pool, which is great for summer. It's got a 4.5 star rating from 115 reviews, so people generally like it. For five bucks for adults and three for kids, it's pretty affordable too. They've got lap lanes if you're trying to get some exercise in, plus picnic areas and shade structures. That's always a plus when you're spending a few hours outside. It's in Decatur, GA, which isn't a huge city (around 25,000 people), so it might not be as overwhelmingly crowded as some bigger spots.

Deleted sentence(s):

- “I'd definitely consider it for a casual swim day.”

### R2.3 `pp_pools.ai_description` /public-pools/texas/austin/greater-austin-ymca-central-offices/ (rules applied to this field: R2)

Before:

> Honestly, I'm a bit stumped with this one. The Greater Austin YMCA's central offices are listed at 4000 South I-35 Frontage Road. We've got their hours here, 9 to 5, Monday through Friday, closed on weekends. But it's just the main office, not a pool facility. It's a public YMCA, so normally they'd have pools somewhere. With Austin's population being almost a million people (978,908), I know there are plenty of places to swim. This location, though, just seems to be administrative. I'd call them directly at (512) 322-9622 if you want to find where their actual swimming facilities are. The Google rating is 4/5 from 4 reviews, which is decent for an office, but not really helpful for finding a place to get wet.

After:

> The Greater Austin YMCA's central offices are listed at 4000 South I-35 Frontage Road. We've got their hours here, 9 to 5, Monday through Friday, closed on weekends. But it's just the main office, not a pool facility. It's a public YMCA, so normally they'd have pools somewhere. With Austin's population being almost a million people (978,908), I know there are plenty of places to swim. This location, though, just seems to be administrative. I'd call them directly at (512) 322-9622 if you want to find where their actual swimming facilities are. The Google rating is 4/5 from 4 reviews, which is decent for an office, but not really helpful for finding a place to get wet.

Deleted sentence(s):

- “Honestly, I'm a bit stumped with this one.”

### R2.4 `pp_pools.ai_description` /public-pools/texas/fort-worth/marine-park-pool/ (rules applied to this field: R2)

Before:

> If you're in Fort Worth looking for a good outdoor spot, Marine Park Pool has some nice things going for it. They've got water slides and a lazy river which is always a hit, especially for kids. It's got a 4/5 rating on Google, based on 72 reviews, so most folks seem to like it. Plus, they offer swim lessons, which is great for parents. The pricing is pretty clear too, just remember it's $3 for residents and $5 if you're not from Fort Worth. It's an outdoor spot, so you'll want good weather. Seems like a solid option if you're in the area and want to cool off or get some recreation. I always appreciate when a pool has a dedicated kids' area, like this one does. Just makes it easier for everyone.

After:

> If you're in Fort Worth looking for a good outdoor spot, Marine Park Pool has some nice things going for it. They've got water slides and a lazy river which is always a hit, especially for kids. It's got a 4/5 rating on Google, based on 72 reviews, so most folks seem to like it. Plus, they offer swim lessons, which is great for parents. The pricing is pretty clear too, just remember it's $3 for residents and $5 if you're not from Fort Worth. It's an outdoor spot, so you'll want good weather. Seems like a solid option if you're in the area and want to cool off or get some recreation. Just makes it easier for everyone.

Deleted sentence(s):

- “I always appreciate when a pool has a dedicated kids' area, like this one does.”

### R2.5 `pp_pools.ai_description` /public-pools/florida/hialeah/west-end-park-pool/ (rules applied to this field: R2)

Before:

> Finding an outdoor pool in a city the size of Hialeah, with over 200,000 people, definitely makes sense. The West End Park Pool fits that bill for anyone looking to cool off. It's an outdoor spot, which means you're at the mercy of the weather, but also means you get that fresh air feeling. When I scout these places, I always try to imagine who'd use it most. For an outdoor pool in a city like Hialeah, I'd bet it sees a lot of families and folks just wanting to escape the heat. It's not a year-round thing, of course, being outdoors. So for people in Hialeah, this is a definite summer option. Parking can sometimes be a headache at city parks, so I'd keep that in mind if you're planning a visit here.

After:

> Finding an outdoor pool in a city the size of Hialeah, with over 200,000 people, definitely makes sense. The West End Park Pool fits that bill for anyone looking to cool off. It's an outdoor spot, which means you're at the mercy of the weather, but also means you get that fresh air feeling. For an outdoor pool in a city like Hialeah, I'd bet it sees a lot of families and folks just wanting to escape the heat. It's not a year-round thing, of course, being outdoors. So for people in Hialeah, this is a definite summer option. Parking can sometimes be a headache at city parks, so I'd keep that in mind if you're planning a visit here.

Deleted sentence(s):

- “When I scout these places, I always try to imagine who'd use it most.”

### R2.6 `pp_pools.ai_description` /public-pools/nevada/las-vegas/citrus-grand-pool-deck/ (rules applied to this field: R2)

Before:

> When I look at pool spots in Las Vegas, a lot of them are tucked into big resorts. The Citrus Grand Pool Deck is one of those, part of the Downtown Grand. It pulls in pretty decent reviews, 4.2 out of 5 from over a hundred people. That's a good sign for a casino pool in a city with a population of over 640,000. They're open every day, 9 AM to 7 PM. That's a solid block of time for a dip, especially since a lot of vacation rentals just don't have pools. It's on N 3rd Street, so it's right there if you are staying downtown. Honestly, for a city like Las Vegas, having a reliable pool like this that's open daily is a real benefit.

After:

> The Citrus Grand Pool Deck is one of those, part of the Downtown Grand. It pulls in pretty decent reviews, 4.2 out of 5 from over a hundred people. That's a good sign for a casino pool in a city with a population of over 640,000. They're open every day, 9 AM to 7 PM. That's a solid block of time for a dip, especially since a lot of vacation rentals just don't have pools. It's on N 3rd Street, so it's right there if you are staying downtown. Honestly, for a city like Las Vegas, having a reliable pool like this that's open daily is a real benefit.

Deleted sentence(s):

- “When I look at pool spots in Las Vegas, a lot of them are tucked into big resorts.”

### R2.7 `pp_pools.ai_description` /public-pools/arizona/glendale/glendale-municipal-pool/ (rules applied to this field: R2)

Before:

> Honestly, 3.9 out of 5 isn't bad for a municipal waterpark, especially with 55 reviews. It tells me most people who go to the Glendale Municipal Pool in Glendale, AZ, have a pretty good time. For ten bucks an adult, you get a solid selection of stuff: a lazy river, water slides, even a wave pool. They've got cabanas and concessions too, which is what you'd expect from a place like this. And hey, child admission is only three dollars, which helps keep the cost down for families. For a city of almost a quarter million people, having a pool like this is a big plus. It's a waterpark, so don't go expecting to get any serious lap swimming done. This is all about fun in the sun, cooling off when it's hot.

After:

> Honestly, 3.9 out of 5 isn't bad for a municipal waterpark, especially with 55 reviews. For ten bucks an adult, you get a solid selection of stuff: a lazy river, water slides, even a wave pool. They've got cabanas and concessions too, which is what you'd expect from a place like this. And hey, child admission is only three dollars, which helps keep the cost down for families. For a city of almost a quarter million people, having a pool like this is a big plus. It's a waterpark, so don't go expecting to get any serious lap swimming done. This is all about fun in the sun, cooling off when it's hot.

Deleted sentence(s):

- “It tells me most people who go to the Glendale Municipal Pool in Glendale, AZ, have a pretty good time.”

### R2.8 `pp_pools.ai_description` /public-pools/texas/flower-mound/flower-mound-community-pool/ (rules applied to this field: R2)

Before:

> It's always nice to find a heated indoor pool, especially one with a good set of amenities. The Flower Mound Community Pool has that, plus a warm-up pool and even a sauna. I definitely like the range of options here. With a 3.6 rating from nearly 300 Google reviews, it seems like most users have a pretty decent experience. Twelve bucks for adults and three for kids, which is on the higher side for what I usually see for community pools, but you do get those extra features. Flower Mound itself is a good sized city, almost 80,000 people. So a facility like this gets a fair amount of use. If you're in the area and looking for an indoor swim, it's worth checking out.

After:

> It's always nice to find a heated indoor pool, especially one with a good set of amenities. The Flower Mound Community Pool has that, plus a warm-up pool and even a sauna. With a 3.6 rating from nearly 300 Google reviews, it seems like most users have a pretty decent experience. Twelve bucks for adults and three for kids, which is on the higher side for what I usually see for community pools, but you do get those extra features. Flower Mound itself is a good sized city, almost 80,000 people. So a facility like this gets a fair amount of use. If you're in the area and looking for an indoor swim, it's worth checking out.

Deleted sentence(s):

- “I definitely like the range of options here.”

### R2.9 `pp_pools.ai_description` /public-pools/delaware/wilmington/chichester-high-school-swimming-pool-wilmington/ (rules applied to this field: R2)

Before:

> Honestly, finding a good spot for lap swimming year-round can be tricky, especially if you're in a city like Wilmington, Delaware. Lots of pools are seasonal. That's why the Chichester High School Swimming Pool is a solid option. It's an indoor setup, so you don't have to worry about the weather. They specifically mention lap swimming, which is great because sometimes you show up to a public pool and half the lanes are taken up by swim lessons or water aerobics. I always appreciate when a facility is clear about what's available. For a city the size of Wilmington, with its 70,000-plus residents, having an indoor pool focused on laps is a real plus. It means you've got a consistent place to get your workout in, whether it's summer or the dead of winter.

After:

> Honestly, finding a good spot for lap swimming year-round can be tricky, especially if you're in a city like Wilmington, Delaware. Lots of pools are seasonal. That's why the Chichester High School Swimming Pool is a solid option. It's an indoor setup, so you don't have to worry about the weather. They specifically mention lap swimming, which is great because sometimes you show up to a public pool and half the lanes are taken up by swim lessons or water aerobics. For a city the size of Wilmington, with its 70,000-plus residents, having an indoor pool focused on laps is a real plus. It means you've got a consistent place to get your workout in, whether it's summer or the dead of winter.

Deleted sentence(s):

- “I always appreciate when a facility is clear about what's available.”

### R2.10 `pp_pools.ai_description` /public-pools/ohio/dublin/dublin-community-pool-south/ (rules applied to this field: R2)

Before:

> It looks like the Dublin Community Pool South is a pretty solid option if you're in the Dublin, Ohio area. With a 4.3 rating from 91 reviews, most people seem to have a good time. It's a public pool, which usually means it's straightforward and focused on swimming for the community. Dublin itself isn't a huge city, around 49,000 residents, so I'd guess this pool probably serves a decent chunk of that population. I see their hours are consistent, 10 AM to 8 PM every day, that simplifies planning a visit. Finding a public pool with those kinds of consistent hours is a plus, especially if you're looking to fit a swim into a busy day. It's on Woerner Temple Road, so you'd want to check the map for parking and access. My read is it's a reliable, no-frills place to swim.

After:

> It looks like the Dublin Community Pool South is a pretty solid option if you're in the Dublin, Ohio area. With a 4.3 rating from 91 reviews, most people seem to have a good time. It's a public pool, which usually means it's straightforward and focused on swimming for the community. Dublin itself isn't a huge city, around 49,000 residents, so I'd guess this pool probably serves a decent chunk of that population. I see their hours are consistent, 10 AM to 8 PM every day, that simplifies planning a visit. Finding a public pool with those kinds of consistent hours is a plus, especially if you're looking to fit a swim into a busy day. It's on Woerner Temple Road, so you'd want to check the map for parking and access.

Deleted sentence(s):

- “My read is it's a reliable, no-frills place to swim.”

### R2.11 `pp_pools.ai_description` /public-pools/minnesota/lakeville/lakeville-community-pool/ (rules applied to this field: R2)

Before:

> It's always a good sign when an indoor pool gets a decent number of reviews, and over 300 for Lakeville Community Pool is impressive. With a 3.6 rating, most people seem to like it well enough. For ten bucks, an adult can get in and use the lap lanes, the warm-up pool, and even a sauna. I appreciate a pool that offers more than just the basics. Kids can swim here for only three dollars, which is pretty fair. Being indoors in Lakeville, Minnesota, with a population near 70,000, means it's a spot people probably rely on all year. It's an important option for the community, especially when the weather isn't great. I think it holds its own.

After:

> It's always a good sign when an indoor pool gets a decent number of reviews, and over 300 for Lakeville Community Pool is impressive. With a 3.6 rating, most people seem to like it well enough. For ten bucks, an adult can get in and use the lap lanes, the warm-up pool, and even a sauna. Kids can swim here for only three dollars, which is pretty fair. Being indoors in Lakeville, Minnesota, with a population near 70,000, means it's a spot people probably rely on all year. It's an important option for the community, especially when the weather isn't great.

Deleted sentence(s):

- “I appreciate a pool that offers more than just the basics.”
- “I think it holds its own.”

### R2.12 `pp_pools.ai_description` /public-pools/nevada/las-vegas/best-pool-party-las-vegas-vip-reservations/ (rules applied to this field: R2)

Before:

> If you're in Vegas and looking for a pool, this one's a little different. It's listed as a casino pool, which often means an experience beyond just swimming. The interesting thing is the 24/7 hours they list. With a perfect 5/5 rating from 13 Google reviews, people seem to really like what they offer. That's a strong sign, especially in a city like Las Vegas where there are so many options. The address is 1980 Festival Plaza Dr Suite 431, which is in the bigger Las Vegas area, population over 640,000. It sounds like they're really emphasizing the 'VIP Reservations' part of their name, so I'd definitely call ahead to see how that works for drop-in swimming versus a planned event. My guess is it's more of a curated experience.

After:

> If you're in Vegas and looking for a pool, this one's a little different. It's listed as a casino pool, which often means an experience beyond just swimming. The interesting thing is the 24/7 hours they list. With a perfect 5/5 rating from 13 Google reviews, people seem to really like what they offer. That's a strong sign, especially in a city like Las Vegas where there are so many options. The address is 1980 Festival Plaza Dr Suite 431, which is in the bigger Las Vegas area, population over 640,000. It sounds like they're really emphasizing the 'VIP Reservations' part of their name, so I'd definitely call ahead to see how that works for drop-in swimming versus a planned event.

Deleted sentence(s):

- “My guess is it's more of a curated experience.”

### R2.13 `pp_pools.ai_description` /public-pools/wisconsin/madison/warner-park-pool/ (rules applied to this field: R2)

Before:

> That 4.9 rating from 139 reviews on Google, that's really something for an outdoor public pool. It tells me people generally love it at Warner Park Pool in Madison. I mean, Madison is a good sized city (almost 270,000 people), so they probably have options. This pool offering restrooms, parking, a picnic area, and shade structures, that's all you really need for a good day outside. Sometimes those shade structures are a big deal, especially if you're out there for a while with family. It sounds like a solid choice if you're in the area and looking to cool off.

After:

> That 4.9 rating from 139 reviews on Google, that's really something for an outdoor public pool. I mean, Madison is a good sized city (almost 270,000 people), so they probably have options. This pool offering restrooms, parking, a picnic area, and shade structures, that's all you really need for a good day outside. Sometimes those shade structures are a big deal, especially if you're out there for a while with family. It sounds like a solid choice if you're in the area and looking to cool off.

Deleted sentence(s):

- “It tells me people generally love it at Warner Park Pool in Madison.”

### R2.14 `pp_pools.ai_description` /public-pools/nevada/las-vegas/garside-pool-2/ (rules applied to this field: R2)

Before:

> If you're looking for a public pool option in Las Vegas, Garside Pool looks like a solid choice. It's got a 4.3 out of 5 from over 300 reviews, which is pretty good for a public spot. The city, Las Vegas, has over 640,000 people, so having places like this is important. They've got some interesting hours, with a break in the middle of the day during the week, so you'd want to check that before heading over. Weekends are different too, with just Saturday afternoons and Sunday closed. My honest take is it's probably a decent setup for locals who know the schedule. Give 'em a call at (702) 229-6393 if you have more questions.

After:

> If you're looking for a public pool option in Las Vegas, Garside Pool looks like a solid choice. It's got a 4.3 out of 5 from over 300 reviews, which is pretty good for a public spot. The city, Las Vegas, has over 640,000 people, so having places like this is important. They've got some interesting hours, with a break in the middle of the day during the week, so you'd want to check that before heading over. Weekends are different too, with just Saturday afternoons and Sunday closed. Give 'em a call at (702) 229-6393 if you have more questions.

Deleted sentence(s):

- “My honest take is it's probably a decent setup for locals who know the schedule.”

### R2.15 `pp_pools.ai_description` /public-pools/ohio/columbus/windsor-swimming-pool/ (rules applied to this field: R2)

Before:

> It looks like the Windsor Swimming Pool in Columbus is a solid public option. I mean, with a population of over 900,000, Columbus has a need for places to cool off, and this one has seen a fair bit of traffic. Out of 76 reviews, it holds a 4.1 out of 5 on Google, which is pretty good for a public pool. Most days, you're looking at an afternoon swim, generally from 1-7 PM, but they shift to noon-6 PM on the weekends. So you get a little extra time on Saturday and Sunday. My take is it's a straightforward spot for a swim.

After:

> It looks like the Windsor Swimming Pool in Columbus is a solid public option. I mean, with a population of over 900,000, Columbus has a need for places to cool off, and this one has seen a fair bit of traffic. Out of 76 reviews, it holds a 4.1 out of 5 on Google, which is pretty good for a public pool. Most days, you're looking at an afternoon swim, generally from 1-7 PM, but they shift to noon-6 PM on the weekends. So you get a little extra time on Saturday and Sunday.

Deleted sentence(s):

- “My take is it's a straightforward spot for a swim.”

## R3: narrator sentences in pool FAQ answers

15 of 640 fields carrying R3.

### R3.1 `pp_pools.ai_faqs` /public-pools/texas/austin/austin-swim-club/ (rules applied to this field: R3)

- **Q:** Is the Austin Swim Club good for families and kids?
  - old answer:
    > As a public pool with a good rating, it's generally a reliable option for families. Many public pools are set up to accommodate swimmers of all ages, including children. I'd check their website or call about specific family programs.
  - new answer:
    > As a public pool with a good rating, it's generally a reliable option for families. Many public pools are set up to accommodate swimmers of all ages, including children.
  - deleted: “I'd check their website or call about specific family programs.”
- **Q:** Is there parking available at Austin Swim Club?
  - answer unchanged
- **Q:** Are there other public pools in Austin besides this one?
  - answer unchanged

### R3.2 `pp_pools.ai_faqs` /public-pools/kentucky/louisville/louisville-family-aquatic-center/ (rules applied to this field: R3)

- **Q:** How much does it cost to swim at the Louisville Family Aquatic Center?
  - answer unchanged
- **Q:** Is the Louisville Family Aquatic Center good for families with kids?
  - old answer:
    > It's called the 'Family Aquatic Center,' and children's admission is only $3, which points to it being family-friendly. However, with Olympic lanes and a diving well, it's also set up for more serious swimming. I'd check if they have dedicated play areas if you have very young kids.
  - new answer:
    > It's called the 'Family Aquatic Center,' and children's admission is only $3, which points to it being family-friendly. However, with Olympic lanes and a diving well, it's also set up for more serious swimming.
  - deleted: “I'd check if they have dedicated play areas if you have very young kids.”
- **Q:** Is there parking available at the Louisville Family Aquatic Center?
  - old answer:
    > The information I have doesn't specify parking. For a facility in a city the size of Louisville (pop. 633,045), I'd expect some parking. Best to check their site or call for details on parking availability and cost.
  - new answer:
    > For a facility in a city the size of Louisville (pop. 633,045), I'd expect some parking. Best to check their site or call for details on parking availability and cost.
  - deleted: “The information I have doesn't specify parking.”

### R3.3 `pp_pools.ai_faqs` /public-pools/new-york/new-york/chinatown-ymca/ (rules applied to this field: R3)

- **Q:** What are the hours for the Chinatown YMCA pool?
  - old answer:
    > The pool is open Monday through Friday from 6:30 AM to 10:00 PM. On Saturdays and Sundays, it's open from 8:00 AM to 5:00 PM. I'd still call and confirm, just to be safe.
  - new answer:
    > The pool is open Monday through Friday from 6:30 AM to 10:00 PM. On Saturdays and Sundays, it's open from 8:00 AM to 5:00 PM.
  - deleted: “I'd still call and confirm, just to be safe.”
- **Q:** How much does it cost to use the YMCA pool?
  - old answer:
    > My data doesn't include specific daily rates for the YMCA. Membership is usually involved, but they might offer day passes. Your best bet is to call the Chinatown YMCA directly at (212) 912-2460 to ask about pricing.
  - new answer:
    > Membership is usually involved, but they might offer day passes. Your best bet is to call the Chinatown YMCA directly at (212) 912-2460 to ask about pricing.
  - deleted: “My data doesn't include specific daily rates for the YMCA.”
- **Q:** Are there other public pools in New York City if this one doesn't work out?
  - answer unchanged

### R3.4 `pp_pools.ai_faqs` /public-pools/texas/corpus-christi/corpus-christi-natatorium/ (rules applied to this field: R3)

- **Q:** How much does it cost to swim at the Corpus Christi Natatorium?
  - answer unchanged
- **Q:** Is the Corpus Christi Natatorium a good place for kids and families?
  - answer unchanged
- **Q:** Is there parking available at the Natatorium?
  - answer unchanged
- **Q:** Are there other public pools in Corpus Christi?
  - old answer:
    > Corpus Christi, with a population of over 300,000, has other pools, though finding year-round indoor options can be tough. The city's parks department website is where I'd start looking for more choices.
  - new answer:
    > Corpus Christi, with a population of over 300,000, has other pools, though finding year-round indoor options can be tough.
  - deleted: “The city's parks department website is where I'd start looking for more choices.”

### R3.5 `pp_pools.ai_faqs` /public-pools/california/san-jose/camden-pool/ (rules applied to this field: R3)

- **Q:** What are the operating hours for Camden Pool?
  - answer unchanged
- **Q:** How much does it cost to use Camden Pool?
  - old answer:
    > The information I have doesn't include specific admission prices. Your best bet is to call the pool directly at (408) 369-6444 or check the San Jose Parks and Recreation website for current rates.
  - new answer:
    > Your best bet is to call the pool directly at (408) 369-6444 or check the San Jose Parks and Recreation website for current rates.
  - deleted: “The information I have doesn't include specific admission prices.”
- **Q:** Is Camden Pool good for kids and families?
  - answer unchanged
- **Q:** Are there other public pools in San Jose if this one doesn't work out?
  - answer unchanged

### R3.6 `pp_pools.ai_faqs` /public-pools/california/san-diego/rancho-family-ymca/ (rules applied to this field: R3)

- **Q:** What are the operating hours for the Rancho Family YMCA pool?
  - answer unchanged
- **Q:** How much does it cost to use the pool at Rancho Family YMCA?
  - old answer:
    > Pricing for guest passes or memberships isn't something I have on hand. Your best bet is to call them directly at (858) 484-8788 or check their website (ymcasd.org) for the most current rates. It varies by location typically.
  - new answer:
    > Your best bet is to call them directly at (858) 484-8788 or check their website (ymcasd.org) for the most current rates. It varies by location typically.
  - deleted: “Pricing for guest passes or memberships isn't something I have on hand.”
- **Q:** Is the Rancho Family YMCA a good place for families with kids?
  - old answer:
    > YMCAs are generally very family-friendly, and this public pool in San Diego should be no exception. They usually have programs for kids and varying pool depths. I'd call ahead to ask about specific kid-friendly amenities or scheduled family swim times.
  - new answer:
    > YMCAs are generally very family-friendly, and this public pool in San Diego should be no exception. They usually have programs for kids and varying pool depths.
  - deleted: “I'd call ahead to ask about specific kid-friendly amenities or scheduled family swim times.”
- **Q:** Are there other public pools nearby in San Diego if this one doesn't work out?
  - answer unchanged

### R3.7 `pp_pools.ai_faqs` /public-pools/florida/jacksonville/terry-parker-pool/ (rules applied to this field: R3)

- **Q:** What are Terry Parker Pool's operating hours?
  - answer unchanged
- **Q:** Is Terry Parker Pool good for kids and families?
  - answer unchanged
- **Q:** Are there other public pools in Jacksonville I can use?
  - old answer:
    > Jacksonville has nearly a million people, so there are definitely other public pools beyond Terry Parker Pool. I'd check the official Jacksonville Parks and Recreation website, or give their main office a call, to find a full list of options that might be open more often.
  - new answer:
    > Jacksonville has nearly a million people, so there are definitely other public pools beyond Terry Parker Pool.
  - deleted: “I'd check the official Jacksonville Parks and Recreation website, or give their main office a call, to find a full list of options that might be open more often.”

### R3.8 `pp_pools.ai_faqs` /public-pools/washington/bellevue/bellevue-family-aquatic-center/ (rules applied to this field: R3)

- **Q:** How much does it cost to get into the pool?
  - answer unchanged
- **Q:** Is the Bellevue Family Aquatic Center good for young kids?
  - answer unchanged
- **Q:** Is there parking at the Bellevue Family Aquatic Center?
  - old answer:
    > The information I have doesn't specify dedicated parking. Given it's a city facility, there's likely some parking available, but I couldn't tell you how much. I'd plan to arrive a bit early, especially on busy days, or check the city's parks site for parking details.
  - new answer:
    > Given it's a city facility, there's likely some parking available, but I couldn't tell you how much. I'd plan to arrive a bit early, especially on busy days, or check the city's parks site for parking details.
  - deleted: “The information I have doesn't specify dedicated parking.”
- **Q:** Are there other public pools in Bellevue besides the Aquatic Center?
  - answer unchanged

### R3.9 `pp_pools.ai_faqs` /public-pools/colorado/aurora/cook-park-pool-co/ (rules applied to this field: R3)

- **Q:** Are there other pools in Aurora, CO if this one doesn't work out?
  - old answer:
    > Yes, a city of Aurora's size will definitely have other public pools, both outdoor and indoor, run by the city or other organizations. I'd check the Aurora Parks and Recreation department's website for a full list of their aquatic facilities if Cook Park Pool doesn't fit the bill.
  - new answer:
    > Yes, a city of Aurora's size will definitely have other public pools, both outdoor and indoor, run by the city or other organizations.
  - deleted: “I'd check the Aurora Parks and Recreation department's website for a full list of their aquatic facilities if Cook Park Pool doesn't fit the bill.”

### R3.10 `pp_pools.ai_faqs` /public-pools/texas/houston/yellowstone-swimming-pool/ (rules applied to this field: R3)

- **Q:** What are the operating hours for Yellowstone Swimming Pool?
  - answer unchanged
- **Q:** Is there parking available at the Yellowstone Swimming Pool?
  - answer unchanged
- **Q:** Are there other public pools in Houston if this one isn't a good fit?
  - old answer:
    > Houston is a very large city with over 2.3 million people. I'm sure there are many other public and private pool options around. Checking the Houston Parks and Recreation Department website or a local search should help.
  - new answer:
    > Houston is a very large city with over 2.3 million people. Checking the Houston Parks and Recreation Department website or a local search should help.
  - deleted: “I'm sure there are many other public and private pool options around.”

### R3.11 `pp_pools.ai_faqs` /public-pools/north-carolina/charlotte/bette-rae-thomas-recreation-center/ (rules applied to this field: R3)

- **Q:** What are the Bette Rae Thomas Recreation Center pool hours?
  - answer unchanged
- **Q:** How much does it cost to use the pool at Bette Rae Thomas Recreation Center?
  - old answer:
    > The information I have doesn't list specific admission prices. For current rates or membership options, your best bet is to call the center directly at (980) 314-1111 or check their Mecklenburg County Park and Recreation website.
  - new answer:
    > For current rates or membership options, your best bet is to call the center directly at (980) 314-1111 or check their Mecklenburg County Park and Recreation website.
  - deleted: “The information I have doesn't list specific admission prices.”
- **Q:** Is the Bette Rae Thomas pool good for kids and families?
  - answer unchanged
- **Q:** Is there parking or accessibility for people with disabilities?
  - answer unchanged
- **Q:** Are there other public pools in Charlotte if this one isn't a good fit?
  - old answer:
    > Charlotte is a large city, so there are other public pools and recreation centers. I'd suggest checking the Mecklenburg County Park and Recreation website or calling them to find other options that might be closer or have different amenities.
  - new answer:
    > Charlotte is a large city, so there are other public pools and recreation centers.
  - deleted: “I'd suggest checking the Mecklenburg County Park and Recreation website or calling them to find other options that might be closer or have different amenities.”

### R3.12 `pp_pools.ai_faqs` /public-pools/colorado/aurora/connect-at-first-creek-pool/ (rules applied to this field: R3)

- **Q:** Is this pool good for families with kids?
  - old answer:
    > The Connect at First Creek Pool is an outdoor community pool, which generally means it's set up for general recreation. That usually includes space for families and kids to swim and cool off in the summer. I'd expect it to be family-friendly.
  - new answer:
    > The Connect at First Creek Pool is an outdoor community pool, which generally means it's set up for general recreation. That usually includes space for families and kids to swim and cool off in the summer.
  - deleted: “I'd expect it to be family-friendly.”
- **Q:** Are there other outdoor pools in Aurora, CO?
  - answer unchanged

### R3.13 `pp_pools.ai_faqs` /public-pools/nevada/las-vegas/pavilion-center-pool/ (rules applied to this field: R3)

- **Q:** What are the operating hours for the Pavilion Center Pool?
  - answer unchanged
- **Q:** Is the Pavilion Center Pool good for families and kids?
  - answer unchanged
- **Q:** What's the parking situation like at Pavilion Center Pool?
  - answer unchanged
- **Q:** Are there other public pools nearby in Las Vegas?
  - old answer:
    > Las Vegas is a big city with many parks and rec options. If Pavilion Center Pool doesn't fit your needs, the city likely has other public pools. I'd suggest checking the City of Las Vegas site or calling their parks department for a list of other facilities.
  - new answer:
    > Las Vegas is a big city with many parks and rec options. If Pavilion Center Pool doesn't fit your needs, the city likely has other public pools.
  - deleted: “I'd suggest checking the City of Las Vegas site or calling their parks department for a list of other facilities.”

### R3.14 `pp_pools.ai_faqs` /public-pools/nevada/north-las-vegas/silver-mesa-activity-pool/ (rules applied to this field: R3)

- **Q:** What are the hours of the Silver Mesa Activity Pool?
  - answer unchanged
- **Q:** How much does it cost to get into Silver Mesa Activity Pool?
  - old answer:
    > The pricing isn't something I have on hand for this city pool. Your best bet for current admission fees is to call the City of North Las Vegas Parks and Recreation at (702) 633-2550 or check their website at cityofnorthlasvegas.com/things-to-do/pools.
  - new answer:
    > Your best bet for current admission fees is to call the City of North Las Vegas Parks and Recreation at (702) 633-2550 or check their website at cityofnorthlasvegas.com/things-to-do/pools.
  - deleted: “The pricing isn't something I have on hand for this city pool.”
- **Q:** Is the Silver Mesa Activity Pool good for kids and families?
  - answer unchanged
- **Q:** Are there other public pools in North Las Vegas?
  - answer unchanged

### R3.15 `pp_pools.ai_faqs` /public-pools/new-york/queens/astoria-pool/ (rules applied to this field: R3)

- **Q:** How much does it cost to get into Astoria Pool?
  - answer unchanged
- **Q:** Is Astoria Pool good for families with kids?
  - answer unchanged
- **Q:** Is there parking available at Astoria Pool?
  - answer unchanged
- **Q:** Are there other pools like Astoria Pool in Queens?
  - old answer:
    > Queens has a few other public pools operated by NYC Parks, though not all are Olympic-sized or have diving boards. For a full list and details on facilities, I'd suggest checking the NYC Parks website or calling their hotline.
  - new answer:
    > Queens has a few other public pools operated by NYC Parks, though not all are Olympic-sized or have diving boards.
  - deleted: “For a full list and details on facilities, I'd suggest checking the NYC Parks website or calling their hotline.”

## R4: narrator sentences in city intros / FAQ answers

15 of 168 fields carrying R4.

### R4.1 `pp_cities.ai_intro` /public-pools/louisiana/slidell/ (rules applied to this field: R4)

Before:

> When summers hit down here, the heat and humidity are no joke. People spend a lot of time in the water, and we've got a long pool season. Pretty much from April through October you can find people swimming outdoors. It's a mix of folks looking to cool off and families keeping the kids busy. You'll find public pools and a lot of private ones. If you're new around here looking for a place to swim, especially outside of a gym or hotel, your public options are limited. Most people find themselves looking for a community pool or a private rental.

After:

> People spend a lot of time in the water, and we've got a long pool season. Pretty much from April through October you can find people swimming outdoors. It's a mix of folks looking to cool off and families keeping the kids busy. You'll find public pools and a lot of private ones. If you're new around here looking for a place to swim, especially outside of a gym or hotel, your public options are limited. Most people find themselves looking for a community pool or a private rental.

Deleted sentence(s):

- “When summers hit down here, the heat and humidity are no joke.”

### R4.2 `pp_cities.ai_intro` /public-pools/texas/pearland/ (rules applied to this field: R4)

Before:

> Around here, you're looking at a pretty long pool season. Most outdoor pools open up around late May, Memorial Day weekend usually, and they stay open straight through to Labor Day, sometimes a little longer into September if the weather holds and people are still wanting a swim. With the heat we get, pools are a big deal for families, so you'll find a lot of spots geared toward kids with water play areas and slides. It's not so much a lap swimming culture at the public spots during the peak summer, more about cooling off and having fun. If you're new to the Pearland area and want to find a place to swim, starting with the city's aquatic centers is usually your best bet. They keep their schedules pretty clear on their websites.

After:

> Most outdoor pools open up around late May, Memorial Day weekend usually, and they stay open straight through to Labor Day, sometimes a little longer into September if the weather holds and people are still wanting a swim. With the heat we get, pools are a big deal for families, so you'll find a lot of spots geared toward kids with water play areas and slides. It's not so much a lap swimming culture at the public spots during the peak summer, more about cooling off and having fun. If you're new to the Pearland area and want to find a place to swim, starting with the city's aquatic centers is usually your best bet. They keep their schedules pretty clear on their websites.

Deleted sentence(s):

- “Around here, you're looking at a pretty long pool season.”

### R4.3 `pp_cities.ai_intro` /public-pools/florida/jacksonville/ (rules applied to this field: R4)

Before:

> The Florida heat means you can pretty much swim year-round here. I've heard some people even put tarps over their pools in winter, heat 'em up a little, and keep going. When it gets really hot, particularly May through September, the public pools in Jacksonville are packed. It's a mix of families cooling off and serious lap swimmers getting their workouts in. If you're new to town, finding a consistent lane can be a challenge at peak times. My advice is to check the schedules online or give a pool a call before you head over. Weekends are always busy, but weekdays, especially mornings, can be a good bet sometimes, depending on the specific location. There are some good public options, but if you want real flexibility, you might have to look beyond those.

After:

> The Florida heat means you can pretty much swim year-round here. When it gets really hot, particularly May through September, the public pools in Jacksonville are packed. It's a mix of families cooling off and serious lap swimmers getting their workouts in. If you're new to town, finding a consistent lane can be a challenge at peak times. Weekends are always busy, but weekdays, especially mornings, can be a good bet sometimes, depending on the specific location. There are some good public options, but if you want real flexibility, you might have to look beyond those.

Deleted sentence(s):

- “I've heard some people even put tarps over their pools in winter, heat 'em up a little, and keep going.”
- “My advice is to check the schedules online or give a pool a call before you head over.”

### R4.4 `pp_cities.ai_intro` /public-pools/texas/bacliff/ (rules applied to this field: R4)

Before:

> Around Bacliff, we're pretty blessed with good pool weather most of the year. You can usually count on swimming comfortably from about March all the way through October, sometimes even into November depending on the year. It's a real blessing for families and anyone who just wants to cool off. A lot of folks here are looking for a casual swim, a place for the kids, or just to relax by the water. Competitive lap swimming isn't as big as just enjoying the water. If you're new to the area and looking for a pool, your best bet is usually public access pools or, if you want something more private, checking out places like PoolRentalNearMe.com for backyard rentals. We've got one public pool listed right now, the Bare Fun In The Sun, which is a good spot.

After:

> Around Bacliff, we're pretty blessed with good pool weather most of the year. You can usually count on swimming comfortably from about March all the way through October, sometimes even into November depending on the year. It's a real blessing for families and anyone who just wants to cool off. Competitive lap swimming isn't as big as just enjoying the water. If you're new to the area and looking for a pool, your best bet is usually public access pools or, if you want something more private, checking out places like PoolRentalNearMe.com for backyard rentals. We've got one public pool listed right now, the Bare Fun In The Sun, which is a good spot.

Deleted sentence(s):

- “A lot of folks here are looking for a casual swim, a place for the kids, or just to relax by the water.”

### R4.5 `pp_cities.ai_faqs` /public-pools/pennsylvania/lancaster/ (rules applied to this field: R4)

- **Q:** What's the typical pool season in Lancaster, PA?
  - answer unchanged
- **Q:** Are there any free public swimming options, or low-cost ways to swim in Lancaster?
  - old answer:
    > Most public pools in Lancaster require an admission fee or a season pass. I don't know of any completely free swimming options that are supervised. Your best bet for low-cost swimming is usually a daily pass at one of the community pools like Lancaster Aquatic Center.
  - new answer:
    > Most public pools in Lancaster require an admission fee or a season pass. Your best bet for low-cost swimming is usually a daily pass at one of the community pools like Lancaster Aquatic Center.
  - deleted: “I don't know of any completely free swimming options that are supervised.”
- **Q:** What are the best pools in Lancaster for families with kids?
  - answer unchanged
- **Q:** Does Lancaster have indoor swimming pools for year-round use?
  - answer unchanged
- **Q:** What if I want to rent a private pool by the hour in Lancaster?
  - answer unchanged

### R4.6 `pp_cities.ai_faqs` /public-pools/pennsylvania/philadelphia/ (rules applied to this field: R4)

- **Q:** When do pools in Philadelphia typically open and close for the season?
  - answer unchanged
- **Q:** Are there any free or low-cost swimming options in Philadelphia?
  - answer unchanged
- **Q:** What's the best way to find a kid-friendly pool in Philadelphia?
  - old answer:
    > Most public pools in Philadelphia are kid-friendly, with sections for general swimming and sometimes spraygrounds. Places like Dendy Recreation Center and Chew Park Pool are good examples. I'd recommend checking the city's parks and rec website for details on specific amenities.
  - new answer:
    > Most public pools in Philadelphia are kid-friendly, with sections for general swimming and sometimes spraygrounds. Places like Dendy Recreation Center and Chew Park Pool are good examples.
  - deleted: “I'd recommend checking the city's parks and rec website for details on specific amenities.”
- **Q:** Does Philadelphia have indoor pools for year-round swimming?
  - answer unchanged
- **Q:** What if I want private pool access without a membership?
  - answer unchanged

### R4.7 `pp_cities.ai_intro` /public-pools/florida/hollywood/ (rules applied to this field: R4)

Before:

> South Florida summers, especially down here in Hollywood, can get long and hot. People look for any excuse to get in the water, and we've got plenty of options. The swim season pretty much runs year-round, though the peak is definitely from spring break right through October. You'll find a mix of serious lap swimmers and families just trying to cool off. A lot of folks here grew up in the water, so pool time is just part of life. If you're new to the area or just visiting, knowing where to find a good pool is key. A lot of the public spots are well-maintained, perfect for getting those laps in or letting the kids splash around. We've got a decent selection of public pools, and then there are always the private rentals if you want something more low-key.

After:

> People look for any excuse to get in the water, and we've got plenty of options. The swim season pretty much runs year-round, though the peak is definitely from spring break right through October. You'll find a mix of serious lap swimmers and families just trying to cool off. If you're new to the area or just visiting, knowing where to find a good pool is key. A lot of the public spots are well-maintained, perfect for getting those laps in or letting the kids splash around.

Deleted sentence(s):

- “South Florida summers, especially down here in Hollywood, can get long and hot.”
- “A lot of folks here grew up in the water, so pool time is just part of life.”
- “We've got a decent selection of public pools, and then there are always the private rentals if you want something more low-key.”

### R4.8 `pp_cities.ai_intro` /public-pools/california/san-mateo/ (rules applied to this field: R4)

Before:

> Around here, you get a good long pool season. From May through October, the weather's usually warm enough for a comfortable outdoor swim. Even in the cooler months, a lot of people are still in the water, especially at indoor spots. It's a pretty active swim scene, a good mix of lap swimmers getting their workout in and families looking for a place for the kids to splash around. If you're new to the area or just visiting San Mateo, the main thing to know is that while public options exist, they can get busy. Looking at private rentals is a good alternative if you want more space or a specific time slot without the crowds.

After:

> From May through October, the weather's usually warm enough for a comfortable outdoor swim. Even in the cooler months, a lot of people are still in the water, especially at indoor spots. It's a pretty active swim scene, a good mix of lap swimmers getting their workout in and families looking for a place for the kids to splash around. If you're new to the area or just visiting San Mateo, the main thing to know is that while public options exist, they can get busy. Looking at private rentals is a good alternative if you want more space or a specific time slot without the crowds.

Deleted sentence(s):

- “Around here, you get a good long pool season.”

### R4.9 `pp_cities.ai_intro` /public-pools/south-carolina/mount-pleasant/ (rules applied to this field: R6+R4)

Before:

> Summer in Mount Pleasant can get pretty hot, and folks here definitely use their pools to cool off. The heat usually sticks around from May right through September, sometimes even into October, so that's when most outdoor pools are open. It's a pretty family-oriented swim scene. Lots of kids splashing around, people just enjoying the water. If you're new in town and looking for a place to swim, it can be a bit tricky because there aren't a ton of public options. Mostly it's neighborhood pools or private clubs. We've only got one public pool listed in our directory for Mount Pleasant, so knowing your options for getting in the water is key.

After:

> The heat usually sticks around from May right through September, sometimes even into October, so that's when most outdoor pools are open. It's a pretty family-oriented swim scene. Lots of kids splashing around, people just enjoying the water. If you're new in town and looking for a place to swim, it can be a bit tricky because there aren't a ton of public options. Mostly it's neighborhood pools or private clubs.

Deleted sentence(s):

- “Summer in Mount Pleasant can get pretty hot, and folks here definitely use their pools to cool off.”
- “We've only got one public pool listed in our directory for Mount Pleasant, so knowing your options for getting in the water is key.”

### R4.10 `pp_cities.ai_faqs` /public-pools/iowa/cedar-rapids/ (rules applied to this field: R4)

- **Q:** When do pools typically open and close for the season in Cedar Rapids?
  - answer unchanged
- **Q:** Are there any free or really low-cost swimming options available?
  - old answer:
    > Most public pools in Cedar Rapids have an entry fee, but it's usually pretty affordable, especially with season passes. I don't know of any completely free public pools. Some parks might have splash pads, which are free for younger kids.
  - new answer:
    > Most public pools in Cedar Rapids have an entry fee, but it's usually pretty affordable, especially with season passes. Some parks might have splash pads, which are free for younger kids.
  - deleted: “I don't know of any completely free public pools.”
- **Q:** What are the best pools in Cedar Rapids for kids and families?
  - answer unchanged
- **Q:** Are there many indoor pool options in Cedar Rapids for year-round swimming?
  - answer unchanged
- **Q:** Can I rent a private backyard pool for a few hours in Cedar Rapids?
  - answer unchanged

### R4.11 `pp_cities.ai_intro` /public-pools/georgia/marietta/ (rules applied to this field: R4)

Before:

> Around here, you get a good long pool season. From late May right through September, maybe even early October depending on the year, people are looking for a place to swim. It's hot and humid for a big chunk of that. It's a pretty family-focused area so you'll see a lot of kids splashes, swim lessons, that kind of thing. For someone just moving to Marietta or visiting, finding a good pool is usually pretty straightforward. Public pools are pretty popular, and there's a strong community vibe around those spots. If you're looking for something more private, or just a different experience without the crowds, that's where we come in. I built PoolRentalNearMe.com for exactly that situation: easy access to backyard pools by the hour.

After:

> From late May right through September, maybe even early October depending on the year, people are looking for a place to swim. It's hot and humid for a big chunk of that. It's a pretty family-focused area so you'll see a lot of kids splashes, swim lessons, that kind of thing. For someone just moving to Marietta or visiting, finding a good pool is usually pretty straightforward. Public pools are pretty popular, and there's a strong community vibe around those spots. If you're looking for something more private, or just a different experience without the crowds, that's where we come in.

Deleted sentence(s):

- “Around here, you get a good long pool season.”
- “I built PoolRentalNearMe.com for exactly that situation: easy access to backyard pools by the hour.”

### R4.12 `pp_cities.ai_faqs` /public-pools/georgia/roswell/ (rules applied to this field: R4)

- **Q:** What's the typical pool season in Roswell, GA?
  - answer unchanged
- **Q:** Are there any free or really low-cost swimming options in Roswell?
  - old answer:
    > Most public pools like the Roswell Aquatic Center or Roswell Community Pool will have daily admission fees, but these are generally pretty low. I don't know of any completely free public swimming spots. Check with the city recreation department for current rates and resident discounts.
  - new answer:
    > Most public pools like the Roswell Aquatic Center or Roswell Community Pool will have daily admission fees, but these are generally pretty low. Check with the city recreation department for current rates and resident discounts.
  - deleted: “I don't know of any completely free public swimming spots.”
- **Q:** Which pools are best for families with kids?
  - answer unchanged
- **Q:** Are there more indoor or outdoor pools in Roswell?
  - answer unchanged
- **Q:** What if I want a private pool experience without a membership?
  - answer unchanged

### R4.13 `pp_cities.ai_intro` /public-pools/new-york/sprakers/ (rules applied to this field: R4)

Before:

> When summer hits upstate New York, especially around Sprakers, you'll be looking for a pool. Our warm weather season is shorter than some places, usually Memorial Day right through Labor Day, so people definitely make the most of it. It's a mix here, families with kids cooling off, some folks getting their laps in, but mostly it's about enjoying that sunshine while we've got it. If you're new to the area and looking for a dip, your options might seem limited at first glance. We've got pretty tight-knit communities, so knowing where to look is key.

After:

> When summer hits upstate New York, especially around Sprakers, you'll be looking for a pool. Our warm weather season is shorter than some places, usually Memorial Day right through Labor Day, so people definitely make the most of it. It's a mix here, families with kids cooling off, some folks getting their laps in, but mostly it's about enjoying that sunshine while we've got it. If you're new to the area and looking for a dip, your options might seem limited at first glance.

Deleted sentence(s):

- “We've got pretty tight-knit communities, so knowing where to look is key.”

### R4.14 `pp_cities.ai_intro` /public-pools/minnesota/woodbury/ (rules applied to this field: R4)

Before:

> Woodbury, Minnesota gets proper hot in the summer, and people here love their pools. I've seen it firsthand; come July, everyone's looking for a way to cool off. The swimming season kicks off around Memorial Day and usually wraps up by Labor Day. It's mostly a family-oriented swim scene around here, with lots of kids splashing around and parents supervising. If you're new in town and looking for a place to swim, expect communal pools to be busy, especially on weekends. Finding a quiet lane for laps can be a bit of a challenge at peak times, but early mornings are usually your best bet. Keep an eye out for local community centers too, a lot of them have indoor options that extend the swim season.

After:

> I've seen it firsthand; come July, everyone's looking for a way to cool off. The swimming season kicks off around Memorial Day and usually wraps up by Labor Day. If you're new in town and looking for a place to swim, expect communal pools to be busy, especially on weekends. Finding a quiet lane for laps can be a bit of a challenge at peak times, but early mornings are usually your best bet. Keep an eye out for local community centers too, a lot of them have indoor options that extend the swim season.

Deleted sentence(s):

- “Woodbury, Minnesota gets proper hot in the summer, and people here love their pools.”
- “It's mostly a family-oriented swim scene around here, with lots of kids splashing around and parents supervising.”

### R4.15 `pp_cities.ai_intro` /public-pools/nevada/henderson/ (rules applied to this field: R4)

Before:

> When you're in the Henderson area, you notice pretty quickly that outdoor pools are a big deal. With the kind of heat we get, a pool is more than just a luxury, it's how you cool down and stay active. Our pool season here is long, usually kicking off in April and running strong through October. You'll find a mix of people in the water, from serious lap swimmers getting their morning workout in to families just trying to beat the heat. If you're new to the area, it's good to know that while there are public options, a lot of folks turn to community centers or private rentals for their swimming needs. It's just part of the lifestyle out here.

After:

> When you're in the Henderson area, you notice pretty quickly that outdoor pools are a big deal. With the kind of heat we get, a pool is more than just a luxury, it's how you cool down and stay active. Our pool season here is long, usually kicking off in April and running strong through October. You'll find a mix of people in the water, from serious lap swimmers getting their morning workout in to families just trying to beat the heat. If you're new to the area, it's good to know that while there are public options, a lot of folks turn to community centers or private rentals for their swimming needs.

Deleted sentence(s):

- “It's just part of the lifestyle out here.”

## R5: wholly non-informative FAQ entries

15 of 58 fields carrying R5.

### R5.1 `pp_pools.ai_faqs` /public-pools/texas/pleasanton/freedom-rv-resort/ (rules applied to this field: R5)

- **Q:** What are the hours for swimming at Freedom RV Resort?
  - answer unchanged
- **Q:** Is the Freedom RV Resort pool good for kids and families?
  - answer unchanged
- **Q:** Is there parking available at Freedom RV Resort?
  - answer unchanged
- **Q:** Are there other public pools in Pleasanton, TX for swimming?
  - **entry deleted** (R5). Old answer:
    > My records indicate Freedom RV Resort having a pool. For other public swimming options in Pleasanton, I'd suggest checking the City of Pleasanton's parks and recreation website or calling their department directly for a list of public pools.

### R5.2 `pp_pools.ai_faqs` /public-pools/nevada/sparks/sparks-community-pool/ (rules applied to this field: R5)

- **Q:** Is Sparks Community Pool good for kids and families?
  - answer unchanged
- **Q:** Is Sparks Community Pool accessible for people with disabilities?
  - **entry deleted** (R5). Old answer:
    > The information I have doesn't specify accessibility features. I'd recommend contacting the pool directly or checking the City of Sparks Parks and Recreation website for details on ramps, lifts, or other accommodations.
- **Q:** Are there other public pools in Sparks, NV?
  - answer unchanged

### R5.3 `pp_pools.ai_faqs` /public-pools/arizona/avondale/avondale-municipal-pool/ (rules applied to this field: R5)

- **Q:** How much does it cost to get into the pool?
  - answer unchanged
- **Q:** Is the Avondale pool good for kids and families?
  - answer unchanged
- **Q:** Is there parking or anything for people with accessibility needs?
  - answer unchanged
- **Q:** Are there other public pools in Avondale if this one is too crowded?
  - **entry deleted** (R5). Old answer:
    > My data is focused on this specific pool. For other options in Avondale, your best bet is to check the City of Avondale's official website or do a quick search online for 'public pools Avondale AZ' to see what else might be available.

### R5.4 `pp_pools.ai_faqs` /public-pools/louisiana/shreveport/shreveport-community-pool/ (rules applied to this field: R5+R3)

- **Q:** How much does it cost to get into the Shreveport Community Pool?
  - answer unchanged
- **Q:** Are there things for young kids to do at the Shreveport Community Pool?
  - answer unchanged
- **Q:** Is the Shreveport Community Pool accessible for people with disabilities?
  - **entry deleted** (R5). Old answer:
    > The information I have doesn't specify accessibility features. I'd recommend contacting the pool directly to ask about their specific accommodations.
- **Q:** Are there other swimming options around Shreveport besides this waterpark?
  - old answer:
    > Shreveport has other pools, but the Community Pool is the main waterpark listed. For other options, I'd check the City of Shreveport's Parks and Recreation department online.
  - new answer:
    > Shreveport has other pools, but the Community Pool is the main waterpark listed.
  - deleted: “For other options, I'd check the City of Shreveport's Parks and Recreation department online.”

### R5.5 `pp_pools.ai_faqs` /public-pools/florida/spring-hill/spring-hill-municipal-pool/ (rules applied to this field: R5)

- **Q:** What are the hours of the Spring Hill Municipal Pool?
  - **entry deleted** (R5). Old answer:
    > The information I have doesn't list exact operating hours. Your best bet is to call the pool directly or check the City of Spring Hill parks and recreation website before you head out.
- **Q:** How much does it cost to get into the pool?
  - answer unchanged
- **Q:** Is the Spring Hill Municipal Pool good for families with young children?
  - answer unchanged
- **Q:** Are there other pools in Spring Hill if this one doesn't work out?
  - answer unchanged

### R5.6 `pp_pools.ai_faqs` /public-pools/georgia/peachtree-city/peachtree-city-municipal-pool/ (rules applied to this field: R5)

- **Q:** What are the hours of the Peachtree City Municipal Pool?
  - **entry deleted** (R5). Old answer:
    > The information I have doesn't list specific operating hours. Your best bet is to call the pool directly or check the Peachtree City Parks and Recreation website before you head over.
- **Q:** How much does it cost to swim at the Peachtree City pool?
  - answer unchanged
- **Q:** Is the Peachtree City Municipal Pool good for families and kids?
  - answer unchanged
- **Q:** Are there other pools or water activities nearby Peachtree City?
  - answer unchanged

### R5.7 `pp_pools.ai_faqs` /public-pools/tennessee/knoxville/knoxville-family-aquatic-center/ (rules applied to this field: R5)

- **Q:** How much does it cost to swim at the Aquatic Center?
  - answer unchanged
- **Q:** Is the Knoxville Family Aquatic Center good for families with young children?
  - answer unchanged
- **Q:** Is there parking available at the Aquatic Center and is it accessible?
  - **entry deleted** (R5). Old answer:
    > The information I have doesn't specify parking details or accessibility features. I'd recommend looking at the city's website or calling the center to confirm what you need.

### R5.8 `pp_pools.ai_faqs` /public-pools/north-carolina/fayetteville/fayetteville-municipal-pool/ (rules applied to this field: R5+R3)

- **Q:** How much does it cost to get into the Fayetteville Municipal Pool?
  - answer unchanged
- **Q:** Is the Fayetteville Municipal Pool good for families and kids?
  - answer unchanged
- **Q:** What are the hours for Fayetteville Municipal Pool?
  - **entry deleted** (R5). Old answer:
    > The hours are not something I have in my data. I'd definitely recommend checking their official website or calling the Fayetteville Parks and Recreation department before you head over.
- **Q:** Is there parking at the Fayetteville Municipal Pool?
  - old answer:
    > My information doesn't specify parking details. For a city-run facility like this, there's usually some parking, but I couldn't tell you if it's paid or limited. Again, a quick call would get you that info.
  - new answer:
    > For a city-run facility like this, there's usually some parking, but I couldn't tell you if it's paid or limited. Again, a quick call would get you that info.
  - deleted: “My information doesn't specify parking details.”
- **Q:** Are there other places to swim in Fayetteville, NC besides this waterpark?
  - answer unchanged

### R5.9 `pp_pools.ai_faqs` /public-pools/arizona/peoria/peoria-aquatic-center/ (rules applied to this field: R5)

- **Q:** What are the admission prices for the Peoria Aquatic Center?
  - answer unchanged
- **Q:** Is the Peoria Aquatic Center suitable for families with kids?
  - answer unchanged
- **Q:** Does the Peoria Aquatic Center have parking or accessibility features?
  - **entry deleted** (R5). Old answer:
    > Details on parking and specific accessibility features aren't in my data. Your best bet is to contact the center directly for that information.
- **Q:** Are there other swimming options if Peoria Aquatic Center is too crowded?
  - answer unchanged

### R5.10 `pp_pools.ai_faqs` /public-pools/california/la-verne/las-flores-pool/ (rules applied to this field: R5)

- **Q:** Is Las Flores Pool good for kids and families?
  - answer unchanged
- **Q:** Are there other public pools in La Verne besides Las Flores Pool?
  - **entry deleted** (R5). Old answer:
    > My current information only lists Las Flores Pool for public access in La Verne. If you're looking for other options, checking the City of La Verne's official website or contacting their parks and recreation department would be the way to go.

### R5.11 `pp_pools.ai_faqs` /public-pools/arizona/goodyear/goodyear-aquatic-center/ (rules applied to this field: R5)

- **Q:** How much does it cost to swim at the Goodyear Aquatic Center?
  - answer unchanged
- **Q:** Is the Goodyear Aquatic Center good for families with small children?
  - answer unchanged
- **Q:** Is there parking available at the Goodyear Aquatic Center?
  - answer unchanged
- **Q:** Are there other indoor pools in Goodyear, AZ?
  - **entry deleted** (R5). Old answer:
    > I only have information on Goodyear Aquatic Center right now. For other indoor pool options in Goodyear, you would need to check with the city's parks department or do a quick local search.

### R5.12 `pp_pools.ai_faqs` /public-pools/arizona/casa-grande/casa-grande-municipal-pool/ (rules applied to this field: R5)

- **Q:** How much does it cost to get into the Casa Grande Municipal Pool?
  - answer unchanged
- **Q:** Is the Casa Grande Municipal Pool good for young kids?
  - answer unchanged
- **Q:** Are there other swimming options besides the municipal pool in Casa Grande?
  - **entry deleted** (R5). Old answer:
    > I only have details for the Casa Grande Municipal Pool right now. You might check with local community centers or hotels in the area to see if they offer public swim times or day passes.

### R5.13 `pp_pools.ai_faqs` /public-pools/california/redlands/redlands-community-pool/ (rules applied to this field: R5+R3)

- **Q:** What are the hours for the Redlands Community Pool?
  - old answer:
    > The information I have doesn't list specific hours. I'd definitely recommend checking the City of Redlands Aquatics website or calling them directly at (909) 798-7572 to get the most up-to-date schedule.
  - new answer:
    > I'd definitely recommend checking the City of Redlands Aquatics website or calling them directly at (909) 798-7572 to get the most up-to-date schedule.
  - deleted: “The information I have doesn't list specific hours.”
- **Q:** How much does it cost to use the pool?
  - answer unchanged
- **Q:** Is the Redlands Community Pool good for families and kids?
  - answer unchanged
- **Q:** Are there other pools or swimming options in Redlands, CA?
  - **entry deleted** (R5). Old answer:
    > My current data focuses on this specific community pool. For other options in Redlands, I'd suggest checking the City of Redlands parks and recreation website or doing a local search for 'pools Redlands CA'.

### R5.14 `pp_pools.ai_faqs` /public-pools/florida/coral-springs/coral-springs-community-pool/ (rules applied to this field: R5+R3)

- **Q:** How much does it cost to get into the Coral Springs pool?
  - old answer:
    > Adult admission to the Coral Springs Community Pool is $10. For children, it's $3. This is based on the information I have.
  - new answer:
    > Adult admission to the Coral Springs Community Pool is $10. For children, it's $3.
  - deleted: “This is based on the information I have.”
- **Q:** Is the Coral Springs Community Pool good for kids and families?
  - answer unchanged
- **Q:** Are there other public pools in Coral Springs, FL?
  - **entry deleted** (R5). Old answer:
    > I only have detailed information on the Coral Springs Community Pool as a primary option. You could check the City of Coral Springs website for a list of other public aquatics centers they might operate.

### R5.15 `pp_pools.ai_faqs` /public-pools/new-york/garden-city/garden-city-community-pool/ (rules applied to this field: R5)

- **Q:** How much does it cost to get into Garden City Community Pool?
  - answer unchanged
- **Q:** Is the Garden City Community Pool good for families with young kids?
  - answer unchanged
- **Q:** Is there parking available at the Garden City Community Pool?
  - answer unchanged
- **Q:** Are there other pools in Garden City besides this one?
  - **entry deleted** (R5). Old answer:
    > I only have data for the Garden City Community Pool. For other swimming options in the area, I'd suggest checking the Garden City Parks and Recreation department's website.

## R6: pool-count sentences contradicted by the page count

11 of 11 fields carrying R6 (all of them: fewer than 15 exist on the surrogate).

### R6.1 `pp_cities.ai_intro` /public-pools/south-carolina/mount-pleasant/ (rules applied to this field: R6+R4)

Before:

> Summer in Mount Pleasant can get pretty hot, and folks here definitely use their pools to cool off. The heat usually sticks around from May right through September, sometimes even into October, so that's when most outdoor pools are open. It's a pretty family-oriented swim scene. Lots of kids splashing around, people just enjoying the water. If you're new in town and looking for a place to swim, it can be a bit tricky because there aren't a ton of public options. Mostly it's neighborhood pools or private clubs. We've only got one public pool listed in our directory for Mount Pleasant, so knowing your options for getting in the water is key.

After:

> The heat usually sticks around from May right through September, sometimes even into October, so that's when most outdoor pools are open. It's a pretty family-oriented swim scene. Lots of kids splashing around, people just enjoying the water. If you're new in town and looking for a place to swim, it can be a bit tricky because there aren't a ton of public options. Mostly it's neighborhood pools or private clubs.

Deleted sentence(s):

- “Summer in Mount Pleasant can get pretty hot, and folks here definitely use their pools to cool off.”
- “We've only got one public pool listed in our directory for Mount Pleasant, so knowing your options for getting in the water is key.”

### R6.2 `pp_cities.ai_intro` /public-pools/colorado/centennial/ (rules applied to this field: R6)

Before:

> Around here, when the sun really starts to bake the pavement, usually sometime in May, that's when everyone gets serious about finding a pool. Our swimming season is pretty much straight through Memorial Day to Labor Day. If you're new to the area, it's good to know that a lot of the swimming here is family focused. You'll find plenty of spots for kids to splash around, and a lot of lessons going on. Less of the serious lap-swimming vibe, though you can still find it. We've got a decent number of public pools, four listed in our directory, covering everything from basic swim to full-blown aquatic centers. Finding a pool in Centennial for the summer isn't too hard, but if you're looking for something beyond the public options, there are other ways to go.

After:

> Around here, when the sun really starts to bake the pavement, usually sometime in May, that's when everyone gets serious about finding a pool. Our swimming season is pretty much straight through Memorial Day to Labor Day. If you're new to the area, it's good to know that a lot of the swimming here is family focused. You'll find plenty of spots for kids to splash around, and a lot of lessons going on. Less of the serious lap-swimming vibe, though you can still find it. Finding a pool in Centennial for the summer isn't too hard, but if you're looking for something beyond the public options, there are other ways to go.

Deleted sentence(s):

- “We've got a decent number of public pools, four listed in our directory, covering everything from basic swim to full-blown aquatic centers.”

### R6.3 `pp_cities.ai_intro` /public-pools/wisconsin/milwaukee/ (rules applied to this field: R6)

Before:

> When summer finally hits Milwaukee, people are ready to jump in a pool. It's not a year-round thing here, so when the weather's good, everyone makes the most of it. We've got a decent mix, I'd say. You'll find families cooling off, but there are also dedicated lap swimmers. It's pretty common for folks to hit the public pools as soon as they open, usually late May or early June. Finding a spot is pretty straightforward. Most of the public pools are run by the county or the city, and they're usually open until late August. If you're new in town and looking to swim, just keep in mind that the outdoor season is short but sweet. Even with five pools like Pulaski and Schulz in our directory, a lot of people also look for other options.

After:

> When summer finally hits Milwaukee, people are ready to jump in a pool. It's not a year-round thing here, so when the weather's good, everyone makes the most of it. We've got a decent mix, I'd say. You'll find families cooling off, but there are also dedicated lap swimmers. It's pretty common for folks to hit the public pools as soon as they open, usually late May or early June. Finding a spot is pretty straightforward. Most of the public pools are run by the county or the city, and they're usually open until late August. If you're new in town and looking to swim, just keep in mind that the outdoor season is short but sweet.

Deleted sentence(s):

- “Even with five pools like Pulaski and Schulz in our directory, a lot of people also look for other options.”

### R6.4 `pp_cities.ai_intro` /public-pools/arizona/mesa/ (rules applied to this field: R6)

Before:

> When the summer sun really kicks in here, we're talking triple digits for months on end. That means pools aren't just for cooling off, they're how you live. People around here hit the water to survive the heat, not just for a leisurely swim. You'll find a mix of serious lap swimmers and families looking to escape the heat. It's a pool culture built around beating the Arizona summer. If you're new to the area or just visiting, finding a good pool is key to enjoying your time outside. We've got just one public spot listed for Mesa so far (Skyline Aquatic Center).

After:

> When the summer sun really kicks in here, we're talking triple digits for months on end. That means pools aren't just for cooling off, they're how you live. People around here hit the water to survive the heat, not just for a leisurely swim. You'll find a mix of serious lap swimmers and families looking to escape the heat. It's a pool culture built around beating the Arizona summer. If you're new to the area or just visiting, finding a good pool is key to enjoying your time outside.

Deleted sentence(s):

- “We've got just one public spot listed for Mesa so far (Skyline Aquatic Center).”

### R6.5 `pp_cities.ai_intro` /public-pools/texas/houston/ (rules applied to this field: R6)

Before:

> Houston's summers are long and hot, that's just a fact. People here look for any excuse to get in the water, sometimes as early as April, and often all the way through October. The public pools get a lot of use. It's a pretty diverse swim scene. You'll see serious lap swimmers getting their workouts in early, but by midday, especially on weekends, it's mostly families and folks just trying to cool off. If you're new to the area, don't worry too much about finding a pool. There are options out there, from city-run spots to private clubs. We've got a decent number of places listed for Houston, five public pools right in our directory, plus lots of backyard pools available by the hour.

After:

> Houston's summers are long and hot, that's just a fact. People here look for any excuse to get in the water, sometimes as early as April, and often all the way through October. The public pools get a lot of use. It's a pretty diverse swim scene. You'll see serious lap swimmers getting their workouts in early, but by midday, especially on weekends, it's mostly families and folks just trying to cool off. If you're new to the area, don't worry too much about finding a pool. There are options out there, from city-run spots to private clubs.

Deleted sentence(s):

- “We've got a decent number of places listed for Houston, five public pools right in our directory, plus lots of backyard pools available by the hour.”

### R6.6 `pp_cities.ai_intro` /public-pools/california/sacramento/ (rules applied to this field: R6)

Before:

> Summer in Sacramento can be a real oven, so pools aren't just for fun, they're essential. You'll find a pretty laid-back swimming culture here, mostly families and folks just trying to cool off. When the temperatures start climbing in May, that's when everyone really starts thinking about getting in the water. Most public pools openMemorial Day weekend and stay open through Labor Day. It's not a big lap swimming town from what I've seen at the public spots. You come to Sacramento to beat the heat, splash around, and let the kids burn off some energy. Finding a good spot is usually pretty easy. We've got five public pools on our site for Sacramento, so there are options across the city.

After:

> Summer in Sacramento can be a real oven, so pools aren't just for fun, they're essential. You'll find a pretty laid-back swimming culture here, mostly families and folks just trying to cool off. When the temperatures start climbing in May, that's when everyone really starts thinking about getting in the water. Most public pools openMemorial Day weekend and stay open through Labor Day. It's not a big lap swimming town from what I've seen at the public spots. You come to Sacramento to beat the heat, splash around, and let the kids burn off some energy. Finding a good spot is usually pretty easy.

Deleted sentence(s):

- “We've got five public pools on our site for Sacramento, so there are options across the city.”

### R6.7 `pp_cities.ai_intro` /public-pools/colorado/aurora/ (rules applied to this field: R6)

Before:

> Man, Aurora can get hot, especially come July and August. You really feel it when you're looking for a good place to cool off. The swimming season here generally kicks off around Memorial Day weekend. Most outdoor public pools open up then and run pretty steady until Labor Day. You'll find a solid mix of swimmers, from serious lap folks who are logging miles to families just wanting to splash around. We've got things like wave pools and lazy rivers, so there's a lot to keep the kids entertained too. If you're new to the area or just visiting, the best way to find a spot is to check out the city's parks and recreation department listings. They'll have the most current info on hours and fees. We've got five public pools listed in our directory, so you've got options.

After:

> Man, Aurora can get hot, especially come July and August. You really feel it when you're looking for a good place to cool off. The swimming season here generally kicks off around Memorial Day weekend. Most outdoor public pools open up then and run pretty steady until Labor Day. You'll find a solid mix of swimmers, from serious lap folks who are logging miles to families just wanting to splash around. We've got things like wave pools and lazy rivers, so there's a lot to keep the kids entertained too. If you're new to the area or just visiting, the best way to find a spot is to check out the city's parks and recreation department listings. They'll have the most current info on hours and fees.

Deleted sentence(s):

- “We've got five public pools listed in our directory, so you've got options.”

### R6.8 `pp_cities.ai_faqs` /public-pools/alabama/montgomery/ (rules applied to this field: R6)

- **Q:** What's the typical pool season in Montgomery?
  - answer unchanged
- **Q:** Are there any free or low-cost swimming options in Montgomery?
  - old answer:
    > The Montgomery public pools usually have a small daily entry fee, which keeps them pretty affordable. We've got four listed in our directory: Montgomery Community Pool, Montgomery Municipal Pool, Montgomery Family Aquatic Center, and Montgomery Aquatic Center.
  - new answer:
    > The Montgomery public pools usually have a small daily entry fee, which keeps them pretty affordable.
  - deleted: “We've got four listed in our directory: Montgomery Community Pool, Montgomery Municipal Pool, Montgomery Family Aquatic Center, and Montgomery Aquatic Center.”
- **Q:** What are the best pools for kids and families?
  - answer unchanged
- **Q:** Does Montgomery have indoor pools?
  - answer unchanged
- **Q:** Can I rent a private pool by the hour in Montgomery?
  - answer unchanged

### R6.9 `pp_cities.ai_intro` /public-pools/new-york/brooklyn/ (rules applied to this field: R6)

Before:

> Back when I was first swimming in Brooklyn, a lot of pools were shutting down for the winter right after Labor Day. These days, that's not always the case anymore. Sure, many of the outdoor spots still close up, but you'll find more indoor options stretching the swim season. It's not just about lap swimming here. You'll see plenty of families, especially at the bigger outdoor pools when the weather's good. If you're new to finding a pool, just remember that some places have specific hours for different age groups or types of swimming, so it's always good to check that out before you go. We've got five public pools listed in our directory, so there are options, even if it feels like a big city to navigate.

After:

> Back when I was first swimming in Brooklyn, a lot of pools were shutting down for the winter right after Labor Day. These days, that's not always the case anymore. Sure, many of the outdoor spots still close up, but you'll find more indoor options stretching the swim season. It's not just about lap swimming here. You'll see plenty of families, especially at the bigger outdoor pools when the weather's good. If you're new to finding a pool, just remember that some places have specific hours for different age groups or types of swimming, so it's always good to check that out before you go.

Deleted sentence(s):

- “We've got five public pools listed in our directory, so there are options, even if it feels like a big city to navigate.”

### R6.10 `pp_cities.ai_intro` /public-pools/north-carolina/greensboro/ (rules applied to this field: R6)

Before:

> When it heats up here in Greensboro, and it really does from May through September, folks are looking to cool off. Our swim scene leans pretty heavy into family fun, especially with places like the wave pool and Shipwreck Cove. It's not so much a lap-swim-every-morning kind of town, though you can find that if you look. A lot of people have their spots, but if you're new or just visiting, you might not know where to start. We've got five public pools listed, which is a good baseline, but there are always more options if you want something a bit different than the usual public spot. Knowing the season is key though, because come October, most of the outdoor pools are emptying out for the year.

After:

> When it heats up here in Greensboro, and it really does from May through September, folks are looking to cool off. Our swim scene leans pretty heavy into family fun, especially with places like the wave pool and Shipwreck Cove. It's not so much a lap-swim-every-morning kind of town, though you can find that if you look. A lot of people have their spots, but if you're new or just visiting, you might not know where to start. Knowing the season is key though, because come October, most of the outdoor pools are emptying out for the year.

Deleted sentence(s):

- “We've got five public pools listed, which is a good baseline, but there are always more options if you want something a bit different than the usual public spot.”

### R6.11 `pp_cities.ai_intro` /public-pools/illinois/chicago/ (rules applied to this field: R6)

Before:

> When it finally heats up in the Midwest, people here are ready for the water. Chicago summers mean getting outside, and for a lot of folks, that means finding a pool. Our public pools open up around mid-June and usually stay open through Labor Day. It's mostly a family scene at the outdoor pools. You'll see a mix of serious lap swimmers and families just trying to cool off. Public pools are a big deal for communities here, and they can get pretty busy on hot days. If you're new to the area or just visiting, knowing a few spots can make a summer day. Even with five public pools in our system, finding your perfect swim can sometimes mean looking beyond the city parks.

After:

> When it finally heats up in the Midwest, people here are ready for the water. Chicago summers mean getting outside, and for a lot of folks, that means finding a pool. Our public pools open up around mid-June and usually stay open through Labor Day. It's mostly a family scene at the outdoor pools. You'll see a mix of serious lap swimmers and families just trying to cool off. Public pools are a big deal for communities here, and they can get pretty busy on hot days. If you're new to the area or just visiting, knowing a few spots can make a summer day.

Deleted sentence(s):

- “Even with five public pools in our system, finding your perfect swim can sometimes mean looking beyond the city parks.”

## Every skipped field, with the reason

Production row ids come from the production dry run (section 3). Here each field is identified by its live page. `ALL:` = the field was frozen before any sentence rule ran (insurance word, A3, A4); `R5:`/`R6:`/`R2:`/`R3:`/`R4:` = that pass was skipped and the field left as the other passes made it. Reasons: `next_sentence_refers_back` (the next kept sentence starts with It/They/That/So ...), `deleted_sentence_names_an_entity`, `field_would_be_empty`, `below_min_length` (A1), `paragraph_break` (A2), `insurance` (a narrator sentence mentions insurance/liability/coverage/claims/damage), `insurance_anywhere` (A3), `contains_mark` (A4), `empty_list` (R1: `[]`).

| Skip | Page | Field | Note |
|---|---|---|---|
| `ALL:insurance` | /public-pools/florida/boynton-beach/boynton-beach-community-pool/ | pp_pools.ai_faqs | changed by another rule |
| `ALL:insurance` | /public-pools/florida/port-st-lucie/port-st-lucie-community-pool/ | pp_pools.ai_faqs |  |
| `ALL:insurance` | /public-pools/nevada/las-vegas/wynn-xs-night-swim/ | pp_pools.ai_faqs |  |
| `ALL:insurance` | /public-pools/north-carolina/apex/apex-aquatic-center/ | pp_pools.ai_description |  |
| `ALL:insurance` | /public-pools/north-carolina/wake-forest/wake-forest-municipal-pool/ | pp_pools.ai_faqs | changed by another rule |
| `ALL:insurance` | /public-pools/texas/flower-mound/flower-mound-aquatic-center/ | pp_pools.ai_description |  |
| `ALL:insurance` | /public-pools/texas/round-rock/round-rock-aquatic-center/ | pp_pools.ai_faqs |  |
| `ALL:insurance` | /public-pools/utah/murray/murray-outdoor-pool/ | pp_pools.ai_description |  |
| `ALL:insurance` | /public-pools/wisconsin/milwaukee/hoyt-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/arizona/maricopa/maricopa-community-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/california/bakersfield/ | pp_cities.ai_faqs |  |
| `ALL:insurance_anywhere` | /public-pools/california/los-angeles/van-nuys-sherman-oaks-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/california/stockton/van-buskirk-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/california/whittier/splash-la-mirada-aquatics/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/california/wildomar/ | pp_cities.ai_intro |  |
| `ALL:insurance_anywhere` | /public-pools/florida/fort-myers/fort-myers-community-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/florida/ocala/ocala-aquatic-center/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/florida/pembroke-pines/ | pp_cities.ai_intro |  |
| `ALL:insurance_anywhere` | /public-pools/georgia/peachtree-city/ | pp_cities.ai_intro |  |
| `ALL:insurance_anywhere` | /public-pools/hawaii/honolulu/central-ymca-of-honolulu-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/idaho/boise/ivywild-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/idaho/boise/west-ymca-boise-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/indiana/carmel/carmel-family-aquatic-center/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/iowa/des-moines/ashworth-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/iowa/des-moines/birdland-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/louisiana/new-orleans/new-orleans-family-aquatic-center/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/mississippi/jackson/mcdowell-road-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/nebraska/omaha/montclair-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/nevada/las-vegas/ayu-dayclub/ | pp_pools.ai_faqs |  |
| `ALL:insurance_anywhere` | /public-pools/nevada/las-vegas/marquee-dayclub/ | pp_pools.ai_faqs |  |
| `ALL:insurance_anywhere` | /public-pools/new-mexico/albuquerque/sandia-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/new-york/bronx/williamsbridge-oval-recreation-center/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/new-york/queens/city-snooker-pool-house/ | pp_pools.ai_faqs |  |
| `ALL:insurance_anywhere` | /public-pools/oklahoma/oklahoma-city/pelican-bay-aquatic-center/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/oregon/beaverton/beaverton-community-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/texas/el-paso/chapoteo-water-park/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/texas/irving/irving-municipal-pool/ | pp_pools.ai_faqs |  |
| `ALL:insurance_anywhere` | /public-pools/texas/katy/katy-municipal-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/texas/mansfield/mansfield-community-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/texas/pflugerville/pflugerville-municipal-pool/ | pp_pools.ai_faqs |  |
| `ALL:insurance_anywhere` | /public-pools/texas/plano/plano-aquatic-center/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/texas/southlake/southlake-aquatic-center/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/texas/southlake/southlake-community-pool/ | pp_pools.ai_faqs |  |
| `ALL:insurance_anywhere` | /public-pools/texas/washington/pine-lake-clothing-optional-rv-camping/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/utah/west-valley-city/centennial-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/virginia/sterling/sterling-community-pool/ | pp_pools.ai_description |  |
| `ALL:insurance_anywhere` | /public-pools/washington/vancouver/vancouver-municipal-pool/ | pp_pools.ai_faqs |  |
| `ALL:insurance_anywhere` | /public-pools/wisconsin/madison/monona-community-pool/ | pp_pools.ai_description |  |
| `R1:empty_list` | /public-pools/california/los-angeles/ymca-of-metropolitan-los-angeles-corporate-office/ | pp_pools.ai_best_for |  |
| `R1:empty_list` | /public-pools/california/san-diego/ymca-of-san-diego-county-corporate-office/ | pp_pools.ai_best_for |  |
| `R1:empty_list` | /public-pools/california/san-francisco/ymca-of-greater-san-francisco-association-office/ | pp_pools.ai_best_for |  |
| `R1:empty_list` | /public-pools/california/san-jose/ymca-of-silicon-valley-association-office/ | pp_pools.ai_best_for |  |
| `R1:empty_list` | /public-pools/florida/kissimmee/american-association-for-nude-recreation/ | pp_pools.ai_best_for |  |
| `R1:empty_list` | /public-pools/ohio/parma/great-lakes-boats-brokerage-llc/ | pp_pools.ai_best_for |  |
| `R1:empty_list` | /public-pools/texas/austin/greater-austin-ymca-central-offices/ | pp_pools.ai_best_for |  |
| `R2:deleted_sentence_names_an_entity` | /public-pools/arkansas/little-rock/champagnolle-pool-little-rock/ | pp_pools.ai_description |  |
| `R2:deleted_sentence_names_an_entity` | /public-pools/colorado/broomfield/broomfield-community-pool/ | pp_pools.ai_description |  |
| `R2:deleted_sentence_names_an_entity` | /public-pools/florida/miami/normandy-isle-pool-miami/ | pp_pools.ai_description |  |
| `R2:deleted_sentence_names_an_entity` | /public-pools/illinois/chicago/chase-park-pool-outdoor/ | pp_pools.ai_description |  |
| `R2:deleted_sentence_names_an_entity` | /public-pools/north-carolina/charlotte/prosperity-park-pool/ | pp_pools.ai_description |  |
| `R2:deleted_sentence_names_an_entity` | /public-pools/north-carolina/ocean-isle-beach/whispering-pines-nudist-resort/ | pp_pools.ai_description |  |
| `R2:deleted_sentence_names_an_entity` | /public-pools/ohio/columbus/cherry-creek-ymca-headstart/ | pp_pools.ai_description |  |
| `R2:deleted_sentence_names_an_entity` | /public-pools/pennsylvania/philadelphia/francisville-recreation-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/arizona/avondale/avondale-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/arizona/buckeye/buckeye-family-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/arizona/goodyear/goodyear-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/arizona/peoria/peoria-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/arizona/phoenix/deer-valley-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/arizona/phoenix/eastlake-swimming-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/arizona/phoenix/hermoso-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/arizona/phoenix/paradise-valley-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/berkeley/king-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/coronado/brian-bent-memorial-aquatics-complex/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/covina/covina-park-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/elk-grove/wackford-aquatic-complex/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/livermore/robert-livermore-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/long-beach/martin-luther-king-jr-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/los-angeles/collins-katz-family-ymca/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/los-angeles/hollywood-ymca/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/los-angeles/venice-indoor-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/los-angeles/ymca-of-glendale/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/murrieta/murrieta-mesa-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/palo-alto/rinconada-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/rancho-cucamonga/rc-family-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-diego/admiral-prout-field-house-outdoor-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-diego/s-d-s-u-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-diego/standley-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-diego/tierrasanta-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-francisco/aquatic-park/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-francisco/bayview-hunter-s-point-ymca/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-francisco/glen-park-recreation-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-francisco/mission-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-francisco/presidio-community-ymca/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-francisco/richmond-district-ymca/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-francisco/rossi-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-francisco/sunset-recreation-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-jose/neptune-aquatics/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-jose/safesplash-swim-school-san-jose-crane-court/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/san-jose/waterworks-aquatics-san-jose/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/santa-monica/santa-monica-family-ymca/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/temescal-valley/glen-eden-sun-club/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/california/walnut-creek/clarke-memorial-swim-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/colorado/aurora/connect-at-first-creek-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/colorado/aurora/eisenhower-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/colorado/aurora/green-valley-ranch-east-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/colorado/aurora/redstone-apartment-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/colorado/broomfield/broomfield-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/colorado/lakewood/lakewood-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/colorado/littleton/mountain-air-ranch/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/deltona/deltona-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/deltona/deltona-family-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/hollywood/hollywood-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/jacksonville/blue-cypress-park-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/jacksonville/nas-jax-outdoor-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/jacksonville/paxon-swim-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/miami-beach/haulover-nude-beach/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/miami/splash-miami/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/miami/venetian-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/naples/naples-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/naples/naples-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/ocala/ocala-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/palm-beach-gardens/palm-beach-gardens-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/spring-hill/spring-hill-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/florida/tallahassee/tallahassee-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/georgia/canton/canton-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/georgia/roswell/roswell-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/georgia/woodstock/woodstock-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/hawaii/honolulu/dillingham-pool-honolulu/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/hawaii/honolulu/manoa-valley-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/idaho/boise/boise-city-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/chicago/california-park-pool-outdoor/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/chicago/centennial-aquatic-center-splash-pad/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/chicago/chicago-park-district-whitney-young-pool-indoor/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/chicago/dvorak-park-pool-outdoor/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/chicago/eckhart-park-pool-indoor/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/chicago/ellis-park-pool-indoor/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/chicago/gill-pool-indoor/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/chicago/holstein-park-public-pool-outdoor/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/chicago/park-district-of-forest-park-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/chicago/south-side-ymca/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/chicago/west-cook-ymca/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/illinois/evanston/evanston-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/indiana/fishers/fishers-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/indiana/indianapolis/ellenberger-public-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/indiana/indianapolis/garfield-park-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/indiana/indianapolis/riverside-park-family-recreation-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/iowa/des-moines/lions-park-seasonal-wading-pool-des-moines/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/kentucky/lexington/belmond-run-swimming-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/louisiana/baton-rouge/brooks-park-swimming-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/maryland/bethesda/bethesda-outdoor-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/michigan/union-city/turtle-lake-resort-llc/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/minnesota/minneapolis/children-s-activity-pool-minneapolis/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/minnesota/minneapolis/highland-park-pool-minneapolis/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/las-vegas/palms-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/las-vegas/red-rock-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/las-vegas/rio-ipanema-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/las-vegas/stadium-swim/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/las-vegas/temple-nude-spa/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/las-vegas/wynn-xs-night-swim/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/north-las-vegas/beach-club-pool-2/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/north-las-vegas/beach-club-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/north-las-vegas/boulevard-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/north-las-vegas/moorea-beach-club-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/north-las-vegas/silver-mesa-activity-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/nevada/north-las-vegas/wave-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/new-jersey/hardyston/rock-lodge-club/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/new-york/bronx/crotona-park-community-center-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/new-york/brooklyn/bkla-swim-academy/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/new-york/garden-city/garden-city-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/new-york/new-york/hamilton-fish-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/new-york/new-york/town-of-west-new-york-swim-club/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/new-york/queens/city-snooker-pool-house/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/new-york/queens/goldfish-swim-school-glendale/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/new-york/queens/rockaway-ymca/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/new-york/staten-island/staten-island-family-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/north-carolina/apex/apex-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/north-carolina/cary/cary-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/north-carolina/charlotte/aquatic-team-of-mecklenburg/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/north-carolina/charlotte/riverbend-swimclub/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/north-carolina/charlotte/silos-pool-charlotte/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/north-carolina/greensboro/crowne-lake-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/north-carolina/greensboro/oakwood-forest-swimming-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/north-carolina/mooresville/mooresville-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/ohio/cleveland/halloran-swimming-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/ohio/cleveland/loew-pool-cleveland/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/ohio/columbus/grandview-heights-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/ohio/columbus/groveport-recreation-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/ohio/columbus/pickerington-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/ohio/parma/great-lakes-boats-brokerage-llc/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/oklahoma/norman/children-s-splash-pad-norman/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/oregon/bridal-veil/clothing-optional-sandy-island/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/oregon/bridal-veil/rooster-rock-nude-beach/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/pennsylvania/philadelphia/athletic-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/pennsylvania/philadelphia/belmont-hills-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/pennsylvania/philadelphia/francisville-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/pennsylvania/philadelphia/university-city-swim-club/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/pennsylvania/york/york-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/south-carolina/charleston/james-island-recreation-complex-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/tennessee/chattanooga/chattanooga-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/tennessee/franklin/franklin-family-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/tennessee/knoxville/knoxville-family-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/alvord/bluebonnet-nudist-park/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/austin/barton-springs-pool-south-gate/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/austin/deep-eddy-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/austin/east-communities-ymca/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/austin/govalle-neighborhood-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/austin/mabel-davis-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/austin/reed-neighborhood-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/austin/shipe-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/austin/south-austin-recreation-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/conroe/conroe-family-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/dallas/beckley-saner-recreation-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/dallas/central-aquatics-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/dallas/city-lake-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/dallas/frog-pond-water-park-at-farmers-branch-aquatics-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/dallas/holmes-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/dallas/kidd-springs-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/dallas/lake-highlands-family-ymca/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/dallas/semones-family-ymca-town-north/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/fort-worth/roanoke-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/fort-worth/the-pointe-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/georgetown/georgetown-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/houston/jacinto-city-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/houston/university-of-houston-natatorium/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/houston/west-gray-recreation-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/kyle/kyle-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/mansfield/mansfield-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/mckinney/mckinney-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/pleasanton/freedom-rv-resort/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/round-rock/round-rock-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/san-antonio/mays-family-ymca-at-potranco/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/san-antonio/normoyle-park-swimming-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/san-antonio/northside-swim-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/san-antonio/south-side-lions-swimming-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/texas/sugar-land/sugar-land-family-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/utah/west-valley-city/west-valley-family-fitness-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/virginia/arlington/arlington-family-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/virginia/arlington/arlington-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/virginia/chesapeake/chesapeake-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/virginia/richmond/battlefield-green-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/virginia/sterling/sterling-municipal-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/washington/issaquah/tiger-mountain-family-nudist-park/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/washington/spokane/spokane-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/washington/vancouver/vancouver-community-pool/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back` | /public-pools/washington/vancouver/vancouver-family-aquatic-center/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back_a5` | /public-pools/florida/jacksonville/first-coast-ymca-metropolitan-office/ | pp_pools.ai_description |  |
| `R2:next_sentence_refers_back_a5` | /public-pools/indiana/indianapolis/physical-education-natatorium/ | pp_pools.ai_description |  |
| `R3:below_min_length` | /public-pools/california/fresno/ted-c-wills-community-pool/ | pp_pools.ai_faqs |  |
| `R3:below_min_length` | /public-pools/california/los-angeles/ketchum-downtown-ymca/ | pp_pools.ai_faqs |  |
| `R3:below_min_length` | /public-pools/california/sacramento/clunie-pool/ | pp_pools.ai_faqs |  |
| `R3:below_min_length` | /public-pools/california/san-diego/mcgrath-family-ymca/ | pp_pools.ai_faqs |  |
| `R3:below_min_length` | /public-pools/florida/palm-coast/palm-coast-family-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:below_min_length` | /public-pools/indiana/fort-wayne/mcmillen-pool/ | pp_pools.ai_faqs |  |
| `R3:below_min_length` | /public-pools/new-york/brooklyn/ridgewood-ymca/ | pp_pools.ai_faqs |  |
| `R3:below_min_length` | /public-pools/ohio/columbus/worthington-pools/ | pp_pools.ai_faqs |  |
| `R3:below_min_length` | /public-pools/texas/fort-worth/chisholm-aquatics-center/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/california/hesperia/hesperia-civic-plaza-pool/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/california/san-diego/allied-gardens-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/california/watsonville/watsonville-city-pool/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/delaware/wilmington/cool-spring-reservoir-pool/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/florida/miami-beach/haulover-beach-clothing-optional-section/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/illinois/chicago/chase-park-pool-outdoor/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/illinois/chicago/ellis-park-pool-indoor/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/illinois/chicago/sheridan-park-pool-indoor/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/illinois/downers-grove/downers-grove-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/illinois/northbrook/northbrook-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/indiana/indianapolis/krannert-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/iowa/des-moines/birdland-pool/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/michigan/detroit/rouge-park-pool/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/missouri/ava/cactus-canyon-campground-and-resort-llc-rated-1-best-nude-men-only-campground/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/nebraska/omaha/lee-valley-pool/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/nevada/las-vegas/the-pool-at-harrah-s-las-vegas/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/new-jersey/princeton/princeton-community-pool/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/new-york/staten-island/staten-island-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/north-carolina/charlotte/mccrorey-ymca/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/north-carolina/charlotte/west-charlotte-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/ohio/columbus/hilliard-family-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/tennessee/franklin/franklin-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/texas/austin/barton-springs-pool-south-gate/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/texas/austin/southwest-family-ymca/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/texas/fort-worth/ridglea-swimming-pool-association/ | pp_pools.ai_faqs |  |
| `R3:deleted_sentence_names_an_entity` | /public-pools/texas/washington/pine-lake-clothing-optional-rv-camping/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/alabama/birmingham/birmingham-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/alabama/huntsville/camelot-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/alabama/montgomery/montgomery-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arizona/avondale/avondale-family-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arizona/avondale/avondale-municipal-pool/ | pp_pools.ai_faqs | changed by another rule |
| `R3:next_sentence_refers_back` | /public-pools/arizona/buckeye/buckeye-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arizona/chandler/hamilton-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arizona/glendale/glendale-family-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arizona/goodyear/goodyear-family-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arizona/phoenix/madison-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arizona/phoenix/paradise-valley-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arizona/phoenix/university-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arizona/phoenix/ymca-westside-silver-fins-at-chris-town/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arizona/queen-creek/queen-creek-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arizona/tempe/kiwanis-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arkansas/little-rock/jim-dailey-fitness-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arkansas/little-rock/riverdale-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/arkansas/little-rock/southwest-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/calimesa/calimesa-community-swim-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/chula-vista/loma-verde-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/concord/concord-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/corona/corona-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/coronado/coronado-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/escondido/rod-mcleod-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/fresno/romain-playground-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/hemet/hemet-community-pool/ | pp_pools.ai_faqs | changed by another rule |
| `R3:next_sentence_refers_back` | /public-pools/california/irvine/northwood-aquatics-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/los-angeles/brenda-villa-aquatic-center-bvac/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/los-angeles/celes-king-iii-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/los-angeles/central-park-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/los-angeles/highland-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/los-angeles/lincoln-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/los-angeles/mid-valley-family-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/los-angeles/montebello-commerce-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/los-angeles/pecan-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/los-angeles/spieker-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/los-angeles/uytengsu-aquatics-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/newport-beach/newport-beach-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/oakland/lions-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/palo-alto/palo-alto-family-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/pomona/pomona-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/sacramento/north-natomas-aquatics-complex/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-diego/admiral-prout-field-house-outdoor-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-diego/bud-kearns-memorial-swimming-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-diego/copley-price-family-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-diego/kearny-mesa-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-diego/las-palmas-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-diego/memorial-pool-2/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-diego/tierrasanta-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-francisco/aquatic-park-bleachers/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-francisco/coffman-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-francisco/sava-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-francisco/waterworks-swim-school-san-francisco/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-jacinto/san-jacinto-aquatics-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-jose/fair-swim-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-jose/neptune-aquatics/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-jose/parkview-park-iii-member-only-swimming-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/san-jose/safesplash-swim-school-san-jose-crane-court/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/california/west-covina/west-covina-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/colorado/aurora/cherry-creek-vista-swimming-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/colorado/aurora/maverick-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/colorado/centennial/centennial-family-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/colorado/highlands-ranch/highlands-ranch-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/connecticut/stamford/stamford-municipal-pool-cummings-park/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/delaware/wilmington/canby-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/boca-raton/boca-raton-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/clearwater/clearwater-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/daytona-beach/daytona-beach-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/jacksonville/blue-cypress-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/jacksonville/brooks-family-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/jacksonville/johnson-family-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/jacksonville/julius-guinyard-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/jacksonville/kensington-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/jacksonville/lake-shore-middle-school-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/jacksonville/oceanway-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/jacksonville/paxon-swim-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/lutz/paradise-lakes-condominium-association-inc/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/miami-beach/miami-beach-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/miami/flamingo-park-pool-miami/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/florida/orlando/college-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/georgia/decatur/decatur-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/georgia/johns-creek/johns-creek-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/georgia/lawrenceville/lawrenceville-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/hawaii/honolulu/dillingham-pool-honolulu/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/idaho/boise/boise-city-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/idaho/boise/ivywild-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/chicago/douglass-park-pool-outdoor/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/chicago/harrison-park-pool-indoor/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/chicago/irving-park-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/chicago/kelly-hall-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/chicago/kosciuszko-park-pool-indoor/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/chicago/portage-park-pool-outdoor/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/chicago/south-side-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/chicago/union-park-pool-outdoor/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/chicago/whealan-family-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/chicago/wrightwood-park-pool-outdoor/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/downers-grove/downers-grove-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/illinois/evanston/evanston-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/indiana/indianapolis/douglass-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/indiana/indianapolis/jcc-indianapolis/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/indiana/indianapolis/orthoindy-foundation-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/iowa/cedar-rapids/cherry-hill-aquatic-center-cedar-rapids/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/iowa/des-moines/nahas-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/kansas/wichita/aley-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/kentucky/louisville/louisville-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/louisiana/new-orleans/new-orleans-family-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/louisiana/new-orleans/new-orleans-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/maryland/bethesda/bethesda-outdoor-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/massachusetts/framingham/framingham-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/michigan/detroit/brennan-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/michigan/grand-rapids/briggs-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/michigan/novi/novi-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/missouri/kansas-city/the-bay-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/nevada/las-vegas/flamingo-family-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/nevada/las-vegas/garside-pool-2/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/nevada/las-vegas/party-naked-las-vegas-sea-mountain-nude-day-club-night-club/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/nevada/las-vegas/rio-ipanema-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/nevada/north-las-vegas/beach-club-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/nevada/north-las-vegas/doolittle-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/nevada/north-las-vegas/jupiter-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/nevada/north-las-vegas/moorea-beach-club-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/nevada/sparks/sparks-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/nevada/summerlin/summerlin-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-jersey/clifton/weasel-brook-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-jersey/princeton/mountain-lakes-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-york/bronx/crotona-park-community-center-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-york/brooklyn/freedom-aquatics/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-york/brooklyn/sunset-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-york/new-york/alfred-e-smith-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-york/new-york/chelsea-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-york/new-york/mccarren-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-york/new-york/newport-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-york/new-york/park-slope-armory-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-york/new-york/red-hook-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/new-york/new-york/swimcity-aquatics/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/north-carolina/apex/apex-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/north-carolina/charlotte/davis-lake-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/north-carolina/charlotte/double-oaks-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/north-carolina/charlotte/johnston-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/north-carolina/charlotte/marion-diehl-recreation-center-and-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/north-carolina/charlotte/simmons-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/north-carolina/charlotte/unc-charlotte-university-recreation-center-urec/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/north-carolina/charlotte/ymca-5/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/north-carolina/fayetteville/fayetteville-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/north-carolina/greensboro/crowne-lake-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/ohio/cleveland/loew-pool-cleveland/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/ohio/columbus/bexley-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/ohio/columbus/maryland-swimming-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/ohio/columbus/university-village-swimming-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/ohio/dublin/dublin-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/oklahoma/oklahoma-city/will-rogers-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/oregon/bridal-veil/rooster-rock-nude-beach/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/oregon/portland/collins-beach-clothing-optional/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/pennsylvania/harrisburg/harrisburg-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/pennsylvania/philadelphia/athletic-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/pennsylvania/philadelphia/chew-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/pennsylvania/philadelphia/christian-street-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/pennsylvania/philadelphia/columbia-north-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/pennsylvania/philadelphia/drexel-university-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/pennsylvania/philadelphia/francisville-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/south-carolina/charleston/james-island-recreation-complex-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/south-carolina/greenville/greenville-county-aquatic-complex/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/south-carolina/myrtle-beach/myrtle-beach-indoor-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/tennessee/knoxville/knoxville-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/tennessee/knoxville/knoxville-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/arlington/hugh-smith-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/arlington/north-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/austin/austin-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/austin/big-stacy-neighborhood-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/austin/dick-nichols-neighborhood-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/austin/dove-springs-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/austin/east-communities-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/austin/john-gaines-pool-private/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/austin/martin-neighborhood-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/austin/springwoods-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/dallas/bachman-indoor-pool-2/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/dallas/bachman-outdoor-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/dallas/coppell-family-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/dallas/everglade-swimming-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/dallas/grand-prairie-family-ymca/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/dallas/pleasant-oaks-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/dallas/robson-lindley-aquatics-center-and-barr-mcmillion-natatorium/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/dallas/samuell-grand-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/dallas/the-cove-aquatic-center-at-samuell-grand/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/dallas/ymca-of-metropolitan-dallas/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/decatur/wildwood-naturist-s-resort/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/fort-worth/recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/houston/independence-heights-swimming/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/houston/mac-gregor-swimming-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/houston/university-of-houston-natatorium/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/houston/west-gray-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/katy/katy-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/new-braunfels/new-braunfels-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/pearland/pearland-family-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/pearland/pearland-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/plano/plano-family-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/richardson/heights-family-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/richardson/richardson-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/san-antonio/elmendorf-lake-park-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/san-antonio/fairchild-recreation-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/texas/san-antonio/george-block-aquatics-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/utah/salt-lake-city/steiner-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/utah/west-valley-city/centennial-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/virginia/chesapeake/chesapeake-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/virginia/fairfax/fairfax-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/virginia/hampton/hampton-municipal-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/virginia/mclean/mclean-aquatic-center/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/virginia/newport-news/newport-news-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/virginia/norfolk/norfolk-community-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/washington/seattle/colman-pool/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/wisconsin/milwaukee/cool-waters-aquatic-park/ | pp_pools.ai_faqs |  |
| `R3:next_sentence_refers_back` | /public-pools/wisconsin/milwaukee/schulz-aquatic-park/ | pp_pools.ai_faqs |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/arizona/new-river/ | pp_cities.ai_faqs |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/arizona/tucson/ | pp_cities.ai_faqs |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/california/antioch/ | pp_cities.ai_faqs |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/california/elk-grove/ | pp_cities.ai_faqs |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/california/la-verne/ | pp_cities.ai_intro |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/california/roseville/ | pp_cities.ai_intro |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/florida/boca-raton/ | pp_cities.ai_intro |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/georgia/marietta/ | pp_cities.ai_faqs |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/illinois/chicago/ | pp_cities.ai_intro | changed by another rule |
| `R4:deleted_sentence_names_an_entity` | /public-pools/michigan/union-city/ | pp_cities.ai_faqs |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/oregon/bridal-veil/ | pp_cities.ai_intro |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/oregon/north-plains/ | pp_cities.ai_faqs |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/texas/allen/ | pp_cities.ai_intro |  |
| `R4:deleted_sentence_names_an_entity` | /public-pools/washington/issaquah/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/alabama/birmingham/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/alabama/mobile/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/arizona/buckeye/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/arizona/buckeye/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/arizona/mesa/ | pp_cities.ai_intro | changed by another rule |
| `R4:next_sentence_refers_back` | /public-pools/arizona/peoria/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/arizona/surprise/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/california/beaumont/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/california/calimesa/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/california/desert-hot-springs/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/california/eastvale/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/california/elk-grove/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/california/fremont/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/california/los-angeles/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/california/menifee/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/california/mission-viejo/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/california/newport-beach/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/california/pomona/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/california/riverside/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/california/san-diego/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/colorado/arvada/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/colorado/castle-rock/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/delaware/wilmington/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/florida/coral-springs/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/florida/daytona-beach/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/florida/hialeah/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/florida/land-o-lakes/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/florida/miami/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/georgia/alpharetta/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/georgia/atlanta/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/georgia/peachtree-city/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/georgia/woodstock/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/hawaii/honolulu/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/illinois/elmhurst/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/illinois/schaumburg/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/indiana/bennington/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/kentucky/lexington/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/maryland/gaithersburg/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/maryland/rockville/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/michigan/ann-arbor/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/michigan/grand-rapids/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/michigan/oxford/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/nevada/carson-city/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/new-jersey/clifton/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/ohio/dayton/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/oregon/beaverton/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/oregon/north-plains/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/oregon/portland/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/south-carolina/myrtle-beach/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/tennessee/memphis/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/texas/decatur/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/texas/el-paso/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/texas/frisco/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/texas/league-city/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/texas/plano/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/texas/richardson/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/texas/san-antonio/ | pp_cities.ai_faqs |  |
| `R4:next_sentence_refers_back` | /public-pools/virginia/hampton/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/virginia/mclean/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/virginia/sterling/ | pp_cities.ai_intro |  |
| `R4:next_sentence_refers_back` | /public-pools/washington/mercer-island/ | pp_cities.ai_intro |  |
| `R6:next_sentence_refers_back` | /public-pools/california/torrance/ | pp_cities.ai_faqs |  |
| `R6:next_sentence_refers_back` | /public-pools/delaware/wilmington/ | pp_cities.ai_intro |  |
| `R6:next_sentence_refers_back` | /public-pools/florida/clearwater/ | pp_cities.ai_faqs |  |
| `R6:next_sentence_refers_back` | /public-pools/kentucky/louisville/ | pp_cities.ai_intro |  |
| `R6:next_sentence_refers_back` | /public-pools/washington/bellevue/ | pp_cities.ai_intro |  |
| `R6:next_sentence_refers_back_a5` | /public-pools/colorado/lakewood/ | pp_cities.ai_faqs |  |
| `R6:next_sentence_refers_back_a5` | /public-pools/illinois/chicago/ | pp_cities.ai_faqs |  |
