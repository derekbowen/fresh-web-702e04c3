#!/usr/bin/env python3
"""Build cleaner/fixtures.json: the rows the local test loads.

    python3 -I cleaner/build_fixtures.py

REAL rows: chosen from the live-page extract of 2026-11-16 (surrogate.py explains how a page becomes a row),
up to PER_CATEGORY rows per outcome category of the reference cleaner (every rule, every skip reason that occurs
in the data, and rows that must not change), selected by md5(url + SEED) so the choice is reproducible.
SYNTHETIC rows: hand-written edge cases (marked "synthetic": true, slug prefix "synthetic-", state
"synthetic-state"), each with a hand-derived expected result in "expect" that does not come from the code.
must_keep: for every fixture field, every sentence that no rule is allowed to delete (not a deletable narrator
sentence, not an R6 'auto' count sentence, not inside a wholly non-informative FAQ answer). The test checks
that all of them are still in the field after apply.
Opens no network or database connection.
"""
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import reference as R  # noqa: E402
import surrogate as S  # noqa: E402

T = R.T
SEED = "fixtures-2026-11-16"
PER_CATEGORY = 3
LIVE = os.path.join(os.path.dirname(HERE), "text-defects", "live-2026-11-16", "live-fields.jsonl.gz")


def pick_key(url):
    return hashlib.md5((url + SEED).encode()).hexdigest()


def categories_pool(p, state_slug):
    out = R.plan_pool(dict(p, state_slug=state_slug))
    cats = []
    for col, d in out.items():
        if d["new"] is not None:
            cats.append(f"pool.{col}:changed:{'+'.join(d['rules'])}")
        for k, v in d["skips"].items():
            cats.append(f"pool.{col}:skip:{k}:{v}")
        if d["new"] is None and not d["skips"]:
            cats.append(f"pool.{col}:unchanged")
    if p["ai_best_for"] is None:
        cats.append("pool.ai_best_for:null")
    return cats


def categories_city(c, actual, distinct):
    out = R.plan_city(c, actual, distinct)
    cats = []
    for col, d in out.items():
        if d["new"] is not None:
            cats.append(f"city.{col}:changed:{'+'.join(d['rules'])}")
        for k, v in d["skips"].items():
            cats.append(f"city.{col}:skip:{k}:{v}")
        if d["new"] is None and not d["skips"]:
            cats.append(f"city.{col}:unchanged")
    for field in [c.get("ai_intro")] + [e.get("a") for e in (c.get("ai_faqs") or []) if isinstance(e, dict)]:
        if isinstance(field, str):
            for s in T.split_sentences(field):
                cat, _ = T.r6_classify(s, actual, distinct)
                if cat not in (None, "consistent", "not_inventory"):
                    cats.append(f"city.r6_statement:{cat}")
                elif cat == "consistent":
                    cats.append("city.r6_statement:consistent")
    return cats


def must_keep_sentences(text, pool_page, actual=None, distinct=None, question=None):
    if T.ABBREV_MARK in text:    # A4: the whole field must stay as it is (the splitter would rewrite the mark)
        return [text]
    keep = []
    for s in T.split_sentences(text):
        kind, cls, ok, why = T.classify(s, pool_page, question=question)
        if kind is not None and ok:
            continue
        if actual is not None and T.r6_classify(s, actual, distinct)[0] == "auto":
            continue
        keep.append(s)
    return keep


SYN_STATE = "synthetic-state"


def synthetic():
    """Hand-written edge cases. 'expect' values were derived by hand from rules.json + the addendum."""
    cities, pools, expect = [], [], {}
    tv = {"id": S.uid("synthetic:testville"), "url": None, "state_slug": SYN_STATE, "city_slug": "testville",
          "city_name": "Testville", "is_published": True, "header_count": 7, "synthetic": True,
          "ai_intro": ("Testville has hot summers and busy pools. Our site lists five public pools in Testville. "
                       "The Main Street pool opens at 9 a.m. on weekdays and charges $4.50 for adults. "
                       "I always tell people to bring water. "
                       "Lifeguards are on duty every afternoon from June to August."),
          "ai_faqs": None}
    expect[("pp_cities", tv["id"], "ai_intro")] = {
        "new": ("Testville has hot summers and busy pools. The Main Street pool opens at 9 a.m. on weekdays and "
                "charges $4.50 for adults. Lifeguards are on duty every afternoon from June to August."),
        "rules": "R6+R4", "why": "wrong directory count (5 vs 7 published) and pure narrator advice deleted; "
                                 "'a.m.' and '$4.50' must not split sentences"}
    sm = {"id": S.uid("synthetic:sampleton"), "url": None, "state_slug": SYN_STATE, "city_slug": "sampleton",
          "city_name": "Sampleton", "is_published": True, "header_count": 3, "synthetic": True,
          "ai_intro": ("Sampleton has two public pools with heated water and slides. "
                       "We've got a few listed in our directory. Summers here are humid and long."),
          "ai_faqs": [
              {"q": "How many public pools are there in Sampleton?",
               "a": "Our directory lists four public pools in Sampleton. Check the city website for seasonal hours."},
              {"q": "Where else can I swim?",
               "a": "Our directory lists four public pools in Sampleton. I'd suggest calling the parks office for hours."},
              {"q": "Is there a lake?", "a": "Sampleton Lake has a roped swimming area in summer."}]}
    expect[("pp_cities", sm["id"], "ai_intro")] = {
        "new": None, "rules": "", "why": "count without a directory word (review_scope) and a vague 'a few listed': "
                                        "listed for the owner, never automatic"}
    expect[("pp_cities", sm["id"], "ai_faqs")] = {
        "new": [{"q": "How many public pools are there in Sampleton?", "a": "Check the city website for seasonal hours."},
                {"q": "Where else can I swim?", "a": "I'd suggest calling the parks office for hours."},
                {"q": "Is there a lake?", "a": "Sampleton Lake has a roped swimming area in summer."}],
        "rules": "R6", "skip": "R4:field_would_be_empty", "why": "R6 deletes both wrong counts (4 vs 3); R4 would then empty answer 2, so R4 is skipped "
                              "(field_would_be_empty). Answer 2 becomes pure narrator advice: a SECOND run would "
                              "delete that entry with R5 (non-idempotent case, see RUNBOOK)"}
    rf = {"id": S.uid("synthetic:refton"), "url": None, "state_slug": SYN_STATE, "city_slug": "refton",
          "city_name": "Refton", "is_published": True, "header_count": 2, "synthetic": True,
          "ai_intro": ("Refton is a quiet river town with long summers and warm evenings for swimming. "
                       "Our directory lists four public pools in Refton. "
                       "Some of these are outdoor pools that open in June when school lets out."),
          "ai_faqs": None}
    expect[("pp_cities", rf["id"], "ai_intro")] = {
        "new": None, "rules": "", "skip": "R6:next_sentence_refers_back",
        "why": "the wrong count (4 vs 2) is followed by 'Some of these ...': deleting it would leave a dangling "
               "back-reference (caught by A5 before 2026-11-16; since the review revision the rules' own opener "
               "list catches the quantifier pronoun 'Some of')"}
    cv = {"id": S.uid("synthetic:claimville"), "url": None, "state_slug": SYN_STATE, "city_slug": "claimville",
          "city_name": "Claimville", "is_published": True, "header_count": 3, "synthetic": True,
          "ai_intro": ("Claimville summers are hot and long, and the pools fill up fast in July. "
                       "We've got five public pools listed in our directory, so there are options across town. "
                       "The lake beach opens on Memorial Day weekend."),
          "ai_faqs": None}
    expect[("pp_cities", cv["id"], "ai_intro")] = {
        "new": None, "rules": "", "why": "2026-11-16 review: the wrong count (5 vs 3) carries a second clause "
                                        "(', so there are options ...'): review_mixed, never automatic"}
    cities += [tv, sm, rf, cv]
    for c in (tv, sm, rf, cv):
        for i in range(c["header_count"]):
            pools.append({"id": S.uid(f"synthetic:placeholder:{c['city_slug']}:{i}"), "url": None,
                          "slug": f"synthetic-placeholder-{c['city_slug']}-{i}", "name": None, "city": c["city_name"],
                          "city_id": c["id"], "state_slug": SYN_STATE, "ai_best_for": None, "ai_description": None,
                          "ai_faqs": None, "is_published": True, "is_placeholder": True, "synthetic": True})
    # Testville's and Sampleton's published pools are text-less placeholders (they set the page count R6 compares
    # with); the synthetic pool rows with text belong to a third synthetic city without a page, "Textburg".
    tb = {"id": S.uid("synthetic:textburg"), "url": None, "state_slug": SYN_STATE, "city_slug": "textburg",
          "city_name": "Textburg", "is_published": True, "header_count": None, "synthetic": True,
          "ai_intro": None, "ai_faqs": None}
    cities.append(tb)

    def pool(slug, name, **cols):
        p = {"id": S.uid("synthetic:" + slug), "url": None, "slug": "synthetic-" + slug, "name": name,
             "city": "Textburg", "city_id": tb["id"], "state_slug": SYN_STATE, "ai_best_for": None,
             "ai_description": None, "ai_faqs": None, "is_published": True, "is_placeholder": False,
             "synthetic": True}
        p.update(cols)
        pools.append(p)
        return p

    def exp(p, col, new, rules, why, skip=None):
        expect[("pp_pools", p["id"], col)] = {"new": new, "rules": rules, "why": why, "skip": skip}

    p = pool("bf-apostrophe", "Apostrophe Pool", ai_best_for='["families", "kids\' parties", "summer cooldown", "casual recreation"]')
    exp(p, "ai_best_for", "families, kids' parties, summer cooldown, casual recreation", "R1", "apostrophe kept as is")
    p = pool("bf-nested", "Nested Pool", ai_best_for='[["families"], "toddlers"]')
    exp(p, "ai_best_for", None, "", "nested array", "R1:element_not_plain_text")
    p = pool("bf-numbers", "Number Pool", ai_best_for='[1, 2]')
    exp(p, "ai_best_for", None, "", "non-string elements", "R1:element_not_plain_text")
    p = pool("bf-object", "Object Pool", ai_best_for='{"best": "families"}')
    exp(p, "ai_best_for", None, "", "JSON object, not a list", "R1:not_a_list")
    p = pool("bf-plain", "Plain Pool", ai_best_for='families, toddlers')
    exp(p, "ai_best_for", None, "", "already plain text", "R1:not_json")
    p = pool("bf-quote", "Quote Pool", ai_best_for='["the \\"big\\" pool", "laps"]')
    exp(p, "ai_best_for", None, "", "double quote inside an element", "R1:element_not_plain_text")
    p = pool("bf-empty", "Empty Pool", ai_best_for='[]')
    exp(p, "ai_best_for", None, "", "would print an empty line", "R1:empty_list")
    p = pool("bf-insurance", "Waiver Pool", ai_best_for='["liability waiver holders"]')
    exp(p, "ai_best_for", None, "", "insurance word", "R1:insurance")
    p = pool("bf-malformed", "Broken Pool", ai_best_for='["families", "toddlers"')
    exp(p, "ai_best_for", None, "", "malformed JSON", "R1:not_json")
    p = pool("bf-unicode", "Unicode Pool", ai_best_for='["niños", "café swimmers"]')
    exp(p, "ai_best_for", "niños, café swimmers", "R1", "non-ASCII kept byte for byte")
    p = pool("bf-blank", "Blank Pool", ai_best_for='[" "]')
    exp(p, "ai_best_for", None, "", "blank element", "R1:element_not_plain_text")

    d1 = ("Shady Pines Pool sits at 1200 St. Louis Ave. in Textburg and is rated 4.5 stars by 312 reviewers. "
          "I hear a lot from people who love this place. "
          "Lap lanes open at 6 a.m. on weekdays, and the city lists hours at www.textburg.gov/pools for anyone planning ahead. "
          "Kids can use the splash pad until 7 p.m. in July.")
    p = pool("desc-adjacent", "Shady Pines Pool", ai_description=d1)
    exp(p, "ai_description", d1.replace("I hear a lot from people who love this place. ", ""), "R2",
        "filler between two factual sentences; St./Ave./a.m./p.m., 4.5 and a URL must not split")
    d2 = ("The pool was renovated by Dr. Alvarez in 2019 and meets U.S. Red Cross guidelines. "
          "It is listed as Facility No. 4 in the county registry. I think it is a lovely spot. "
          "Swim lessons run every Saturday morning for children aged five and up.")
    p = pool("desc-abbrev", "Alvarez Memorial Pool", ai_description=d2)
    exp(p, "ai_description", d2.replace("I think it is a lovely spot. ", ""), "R2",
        "Dr., U.S. and No. 4 would break a naive splitter")
    p = pool("desc-dangling", "Dangle Pool",
             ai_description="The pool is clean and well run by the city staff all season long. I love it. "
                            "It gets crowded on hot July afternoons, so arrive early to find a shaded table.")
    exp(p, "ai_description", None, "", "next sentence starts with It", "R2:next_sentence_refers_back")
    p = pool("desc-insurance-anywhere", "Covered Pool",
             ai_description="The city says the pool is covered by its liability insurance for all public swim sessions. "
                            "I love the place. Hours are posted at the gate next to the parking lot every week.")
    exp(p, "ai_description", None, "", "a non-narrator insurance sentence freezes the field (A3)",
        "ALL:insurance_anywhere")
    p = pool("desc-insurance-narrator", "Policy Pool",
             ai_description="I'm not sure about their insurance. I love this place. The water is heated year-round "
                            "and the deck has plenty of chairs for families who stay all afternoon.")
    exp(p, "ai_description", None, "", "a narrator sentence mentions insurance (rules.json freeze)", "ALL:insurance")
    p = pool("desc-short", "Small Pool", ai_description="Small pool. I love it.")
    exp(p, "ai_description", None, "", "result would be shorter than 120 characters (A1)", "R2:below_min_length")
    p = pool("desc-paragraph", "Paragraph Pool",
             ai_description="The pool opens in May and closes after Labor Day every year.\n\nI love this place. "
                            "Lifeguards watch every lane and the snack bar sells cold drinks all summer.")
    exp(p, "ai_description", None, "", "deleting would merge two paragraphs (A2)", "R2:paragraph_break")
    p = pool("desc-mark", "Mark Pool",
             ai_description="The pool § 3 rules are posted at the entrance for every visitor to read. I love it. "
                            "Showers are available next to the locker rooms on both sides.")
    exp(p, "ai_description", None, "", "contains the splitter's protection character (A4)", "ALL:contains_mark")
    p = pool("desc-entity", "Entity Pool",
             ai_description="I visited with Coach Rivera last summer. Showers are free for swimmers and the "
                            "locker rooms were renovated recently with new benches and lockers.")
    exp(p, "ai_description", None, "", "deleted sentence names someone the rest may refer to",
        "R2:deleted_sentence_names_an_entity")
    d3 = ("“Best pool in town,” reads the hand-painted sign by the entrance of the Riverside Aquatic Center. "
          "I think so too. Parking is free in the lot behind the bathhouse, and the snack bar sells cold drinks.")
    p = pool("desc-quotes", "Riverside Aquatic Center", ai_description=d3)
    exp(p, "ai_description", d3.replace("I think so too. ", ""), "R2", "curly quotes at a sentence start")
    # 2026-11-16 review cases
    p = pool("desc-last-entity", "Entity Two Pool",
             ai_description="The pool has six lap lanes and a diving board that families use all summer long. "
                            "I always recommend the Riverside Aquatic Center too.")
    exp(p, "ai_description", None, "", "the LAST deleted sentence names a facility: skipped (entity guard on the last "
        "sentence too)", "R2:deleted_sentence_names_an_entity")
    d4 = ("The pool has six lap lanes, a diving board and a shaded lawn that families from all over town use from "
          "Memorial Day through the end of August. "
          "I'd check the City of Textburg Parks and Recreation website for hours.")
    p = pool("desc-last-agency", "Agency Pool", ai_description=d4)
    exp(p, "ai_description", d4.split(" I'd check")[0], "R2",
        "a last-sentence referral naming only a generic agency (City of <city> Parks and Recreation) is still deleted")
    p = pool("desc-fact-marker", "Timing Pool",
             ai_description="It is a city pool with long lap lanes and a deep end for strong swimmers in Textburg. "
                            "I see they even have a timing system.")
    exp(p, "ai_description", None, "", "'they even have a timing system' states an amenity: kept")
    p = pool("desc-nbsp", "Nbsp Pool",
             ai_description="Great vibe overall,\u00a0I really liked it. The pool has six lanes and a slide for kids in summer.")
    exp(p, "ai_description", None, "", "comma + NO-BREAK SPACE + I: a spliced second clause, kept (Python and SQL "
        "now treat U+00A0 as whitespace alike)")
    p = pool("faq-limiter-gap", "Limiter Pool",
             ai_faqs=[{"q": "Are there other free pools?", "a": "I only have data on this facility being free. "
                                                                 "The city website lists other parks with pools."},
                      {"q": "Price?", "a": "Admission is free for everyone."}])
    exp(p, "ai_faqs", None, "", "'I only have data on this facility being free' only LIMITS and carries a price word: "
        "kept, so the entry is not wholly non-informative")
    p = pool("faq-only-one", "Only One Beach",
             ai_faqs=[{"q": "Other clothing-optional spots nearby?",
                       "a": "Clothing-optional spots are rare, and this beach is the only one I show in my system for "
                            "the area. You may need to look further afield in the state."},
                      {"q": "Price?", "a": "Entry is free."}])
    exp(p, "ai_faqs", None, "", "'the only one I show in my system' is an inventory claim: kept")
    p = pool("desc-control", "Control Pool",
             ai_description="Honestly, 35 reviews and a 3.9 out of 5 is decent for a city pool. It is open Wednesdays "
                            "and Fridays from noon to 6 p.m. and costs $2 for adults.")
    exp(p, "ai_description", None, "", "no first-person narrator: must not change")

    f1 = [{"q": "What are the hours?",
           "a": "Their hours aren't something I have on hand. Your best bet is to call the pool directly."},
          {"q": "Is there parking?", "a": "Yes, there is a free lot next to the pool. I'd suggest arriving early on "
                                          "weekends to get a spot.", "keyword": "parking"},
          {"q": "Who runs it?", "a2": "The city.", "a": "The city parks department runs it."},
          {"q": "Any tips?", "a": ["bring water"]},
          {"q": "Can I bring a cooler?", "a": "Coolers are allowed on the lawn but not on the deck."}]
    p = pool("faq-mixed", "Faq Pool", ai_faqs=f1)
    exp(p, "ai_faqs", [{"q": "Is there parking?", "a": "Yes, there is a free lot next to the pool.", "keyword": "parking"},
                       f1[2], f1[3], f1[4]], "R5+R3",
        "entry 1 is wholly non-informative (R5); entry 2 loses its narrator advice (R3) and keeps its extra key; "
        "entries with a2 or a non-string answer are never touched")
    p = pool("faq-only-entry", "Lonely Pool",
             ai_faqs=[{"q": "Hours?", "a": "My information doesn't include the hours. I'd recommend calling ahead."}])
    exp(p, "ai_faqs", None, "", "R5 would empty the array; R3 would empty the answer",
        "R5:array_would_be_empty; R3:field_would_be_empty")
    p = pool("faq-insurance-q", "Claims Pool",
             ai_faqs=[{"q": "Does the pool's insurance cover injuries?",
                       "a": "I don't have information on that. I'd suggest asking the front desk."},
                      {"q": "Is it open?", "a": "It opens daily at noon."}])
    exp(p, "ai_faqs", None, "", "insurance question: entry kept (R5) and array frozen (A3)",
        "R5:insurance; ALL:insurance_anywhere")
    p = pool("faq-short", "Short Answer Pool",
             ai_faqs=[{"q": "Other pools?", "a": "Textburg is a big city. I'd suggest checking the parks department "
                                                 "website for more options."},
                      {"q": "Price?", "a": "Admission is $3 for adults."}])
    exp(p, "ai_faqs", None, "", "answer would shrink below 40 characters (A1)", "R3:below_min_length")
    p = pool("unpublished", "Hidden Pool", is_published=False,
             ai_best_for='["families"]', ai_description="I love this unpublished pool. It has a slide and a diving board.")
    exp(p, "ai_best_for", None, "", "unpublished rows are out of scope")
    exp(p, "ai_description", None, "", "unpublished rows are out of scope")
    # 2026-11-17, third round: the guards answers_question / fact_claim and the freeze ALL:fact_guard_kept
    yes = {"q": "Are there any other indoor pools in Textburg?",
           "a": "The Textburg Rec Center has an indoor lap pool with six lanes. "
                "I'm not aware of any other indoor public pools in town."}
    p = pool("guard-yesno", "Yesno Pool",
             ai_faqs=[yes, {"q": "What are the hours?", "a": "The pool opens at 10 a.m. daily in summer. "
                                                             "I'd call ahead to confirm."}])
    exp(p, "ai_faqs", None, "", "answer 1's narrator sentence answers its yes/no question (answers_question) and "
        "is kept; R3 would still delete answer 2's 'I'd call ahead to confirm.', so the array is frozen",
        "ALL:fact_guard_kept")
    p = pool("guard-open-question", "Open Question Pool",
             ai_faqs=[{"q": "What indoor pools are in Textburg?", "a": yes["a"]}])
    exp(p, "ai_faqs", [{"q": "What indoor pools are in Textburg?",
                        "a": "The Textburg Rec Center has an indoor lap pool with six lanes."}], "R3",
        "the same answer under a question that is not yes/no: the narrator gap sentence is deleted as before")
    p = pool("guard-claim", "Kestrel Park Pool",
             ai_description=("Kestrel Park Pool is an outdoor pool with a lap lane and a diving board in Textburg. "
                             "My records show Kestrel Park Pool as the main public pool in Textburg. "
                             "I love a good swim on a hot afternoon. "
                             "Lifeguards are on duty every day from June to August."))
    exp(p, "ai_description", None, "", "'... as the main public pool ...' is a fact claim and is kept; R2 would "
        "still delete 'I love a good swim on a hot afternoon.', so the description is frozen", "ALL:fact_guard_kept")
    return cities, pools, expect


def main():
    recs = S.load_live(LIVE)
    cities, pools = S.build(recs)
    by_city = {c["id"]: c for c in cities}
    merges = {}
    for url, n in T._dup_merges(os.path.join(os.path.dirname(HERE), "duplicate-mapping.csv")).items():
        seg = url.rstrip("/").split("/")
        merges[(seg[-2], seg[-1])] = n
    actual = {}
    for p in pools:
        actual[p["city_id"]] = actual.get(p["city_id"], 0) + 1
    cat_rows = {}
    for p in pools:
        if p["is_placeholder"]:
            continue
        for k in categories_pool(p, by_city[p["city_id"]]["state_slug"]):
            cat_rows.setdefault(k, []).append(("pool", p))
    for c in cities:
        if c["url"] is None:
            continue
        a = actual.get(c["id"], 0)
        m = merges.get((c["state_slug"], c["city_slug"]))
        for k in categories_city(c, a, a - m if m is not None else None):
            cat_rows.setdefault(k, []).append(("city", c))
    chosen_pools, chosen_cities = {}, {}
    for k in sorted(cat_rows):
        seen = set()
        cand = []
        for kind, r in sorted(cat_rows[k], key=lambda x: pick_key(x[1]["url"])):
            if r["id"] not in seen:
                seen.add(r["id"])
                cand.append((kind, r))
        for kind, r in cand[:PER_CATEGORY]:
            (chosen_pools if kind == "pool" else chosen_cities)[r["id"]] = r
    # every chosen city keeps its published-pool count: its real pools that were chosen + placeholders
    out_cities = dict(chosen_cities)
    for p in chosen_pools.values():
        c = by_city[p["city_id"]]
        out_cities.setdefault(c["id"], dict(c, ai_intro=None, ai_faqs=None, url=None, header_count=None,
                                            text_less_copy=True))
    out_pools = list(chosen_pools.values())
    for c in chosen_cities.values():
        have = sum(1 for p in out_pools if p["city_id"] == c["id"])
        need = (c["header_count"] or 0) - have
        for i in range(max(0, need)):
            out_pools.append({"id": S.uid(f"fixture-placeholder:{c['state_slug']}/{c['city_slug']}/{i}"), "url": None,
                              "slug": f"placeholder-{c['city_slug']}-{i}", "name": None, "city": S.title(c["city_slug"]),
                              "city_id": c["id"], "state_slug": c["state_slug"], "ai_best_for": None,
                              "ai_description": None, "ai_faqs": None, "is_published": True, "is_placeholder": True})
    syn_c, syn_p, expect = synthetic()
    all_cities = list(out_cities.values()) + syn_c
    all_pools = out_pools + syn_p
    # must-keep sentences
    pub_actual = {}
    for p in all_pools:
        if p.get("is_published"):
            pub_actual[p["city_id"]] = pub_actual.get(p["city_id"], 0) + 1
    mk = []
    for p in all_pools:
        if not p.get("is_published") or p.get("is_placeholder"):
            continue
        if p["ai_description"]:
            mk += [{"tbl": "pp_pools", "id": p["id"], "col": "ai_description", "s": s}
                   for s in must_keep_sentences(p["ai_description"], True)]
        for e in p["ai_faqs"] or []:
            if T._plain_entry(e) and not T.answer_is_noninformative(e["a"], True, T._q(e)):
                mk += [{"tbl": "pp_pools", "id": p["id"], "col": "ai_faqs", "s": s}
                       for s in must_keep_sentences(e["a"], True, question=T._q(e))]
    for c in all_cities:
        a = pub_actual.get(c["id"], 0)
        m = merges.get((c["state_slug"], c["city_slug"]))
        dist = a - m if m is not None else None
        if c.get("ai_intro"):
            mk += [{"tbl": "pp_cities", "id": c["id"], "col": "ai_intro", "s": s}
                   for s in must_keep_sentences(c["ai_intro"], False, a, dist)]
        for e in c.get("ai_faqs") or []:
            if T._plain_entry(e) and not T.answer_is_noninformative(e["a"], False, T._q(e)):
                mk += [{"tbl": "pp_cities", "id": c["id"], "col": "ai_faqs", "s": s}
                       for s in must_keep_sentences(e["a"], False, a, dist, T._q(e))]
    real_rows = len(chosen_pools) + len(chosen_cities)
    covered = {k: sum(1 for kind, r in v if r["id"] in chosen_pools or r["id"] in chosen_cities)
               for k, v in sorted(cat_rows.items())}
    doc = {
        "about": __doc__.strip(),
        "seed": SEED,
        "source": "text-defects/live-2026-11-16/live-fields.jsonl.gz (live pages fetched 2026-11-16T19:36Z-20:05Z)",
        "real_text_rows": real_rows,
        "categories_covered": covered,
        "cities": all_cities,
        "pools": all_pools,
        "expect": [{"tbl": k[0], "id": k[1], "col": k[2], **v} for k, v in expect.items()],
        "must_keep": mk,
    }
    with open(os.path.join(HERE, "fixtures.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("real text rows", real_rows, "(pools", len(chosen_pools), "cities", len(chosen_cities), ")",
          "synthetic text rows", sum(1 for p in syn_p if not p.get("is_placeholder")) + 2,
          "pools total", len(all_pools), "cities total", len(all_cities), "must_keep", len(mk))
    for k, v in covered.items():
        print(f"  {v:3d}  {k}")


if __name__ == "__main__":
    main()
