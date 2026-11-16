#!/usr/bin/env python3
"""Single source of truth for the public-pools text-defect rules (Task A, 2026-11-15, revised 2026-11-16).

WHAT THIS FILE IS
  * The regular expressions and the decision procedure behind ../rules.json and ../TEXT-DEFECTS.md.
  * `python3 -I text_defect_rules.py rules`  writes ../rules.json
  * `python3 -I text_defect_rules.py sql`    writes text-defects-measure.sql (READ-ONLY measurement SQL)
  * `python3 -I text_defect_rules.py test`   runs the hand-made before/after examples in examples.json
    through the reference cleaner and fails if any output differs from the hand-made "after" text.
  * `python3 -I text_defect_rules.py live OUTDIR live_*.jsonl`  applies every rule to the page fields that
    extract_live.py saved from the live site and writes a summary, the planned deletions per page and the
    count-statement listing (files only; no network).

WHAT IT NEVER DOES
  It opens no network connection and no database connection, and it writes nothing except
  ../rules.json, text-defects-measure.sql and the `live` outputs in the directory it is given. It never composes text: every operation either deletes
  whole sentences, deletes whole FAQ entries, or re-joins the elements of an existing list.

Every pattern is written in the subset that behaves the same in Python `re` and PostgreSQL ARE:
single-character look-behinds only, `(?i)` only at the very start, no \\b / \\m / \\M.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PARENT = os.path.dirname(HERE)

# --------------------------------------------------------------------------- sentence splitting
# Abbreviations whose trailing period must not end a sentence. Over-protection only ever MERGES two
# sentences, which makes every rule more conservative (a merged unit is deleted only if all of it
# qualifies), so the list errs on the side of protecting.
ABBREV = (r"(?<![A-Za-z])(St|Dr|Mt|Ft|Ave|Blvd|Rd|Jr|Sr|Mr|Mrs|Ms|No|vs|approx|Hwy|Pkwy|Ln|Ct|Co|Inc|"
          r"Dept|Univ|U\.S|a\.m|p\.m|A\.M|P\.M|e\.g|i\.e|[A-HJ-Z])\.")
ABBREV_MARK = "§"  # section sign; measured absent from every text column (see TEXT-DEFECTS.md)
# Whitespace, spelled out (revised 2026-11-16, review finding "regex flavours differ on non-ASCII spaces"):
# exactly the 29 code points Python's \s matches in a str pattern. PostgreSQL's \s depends on the server's
# ctype (under C.UTF-8 it misses U+001C-U+001F, U+0085, U+00A0, U+2007 and U+202F), so no pattern below uses
# \s; they use WS. Python results are unchanged (WS == \s, checked by cleaner/test_cleaner.py), and the SQL
# now splits and guards exactly like Python on any server.
WS = r"[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]"
NOT_WS = "[^" + WS[1:]
SPLIT = r"(?<=[.!?])" + WS + r"+(?=[A-Z0-9\"“‘'$(])"

# --------------------------------------------------------------------------- narrator detection
# (1) first-person singular. Roman-numeral uses ("Phase I", "Pool I") are masked first; "I-35" is excluded.
ROMAN_I = (r"(Phase|Pool|Building|Area|Section|Level|Unit|Part|Title|War|Class|Type|Lot|Zone|Tier|Stage|"
           r"Chapter|Team|Division|Field|Park|Gate|Court) I(?![A-Za-z'’])")
SING = (r"(?<![A-Za-z'’-])(I|I'm|I’m|I'd|I’d|I've|I’ve|I'll|I’ll|[Mm]y|[Mm]e|[Mm]ine|"
        r"[Mm]yself)(?![A-Za-z]|['’][A-Za-z]|-[0-9])")
# (2) first-person plural.
PLUR = (r"(?<![A-Za-z'’])([Ww]e|[Ww]e're|[Ww]e’re|[Ww]e've|[Ww]e’ve|[Ww]e'd|[Ww]e’d|"
        r"[Ww]e'll|[Ww]e’ll|[Oo]ur|[Oo]urs|[Uu]s|[Oo]urselves)(?![A-Za-z'’])")
# (3) local-insider voice without a pronoun ("folks here", "around here", "down here in Fort Lauderdale").
LOCAL = (r"(?<![A-Za-z])(([Aa]round|[Dd]own|[Uu]p|[Oo]ut) here(?![A-Za-z])|[Hh]ere in [A-Z]|"
         r"([Ff]olks|[Pp]eople|[Ee]veryone|[Ee]verybody|[Ll]ocals) (here|around here)(?![A-Za-z])|"
         r"[Ff]olks in (this|these|our)(?![A-Za-z])|in this (town|neck of the woods)(?![A-Za-z]))")
# Site voice: a sentence whose ONLY first-person words are plural and which talks about the directory or
# the marketplace is the site speaking, not an invented narrator. Not a defect (unless it states a pool
# count, which rule R6 handles). A sentence with a singular "I/my/me" is never site voice, even if it
# names PoolRentalNearMe ("I started PoolRentalNearMe.com because..." is an invented founder voice).
SITE = (r"(PoolRentalNearMe|Pool Rental Near Me|(?<![A-Za-z])[Oo]ur (one |only |online |current |public |own )?"
        r"(directory|site|website|listings?|listed|database|map|platform|records|pages?|list)(?![A-Za-z])|"
        r"(?<![A-Za-z])[Ww]e( have|'ve|’ve)( got)?( [a-z]+){0,4} listed(?![A-Za-z])|"
        r"(?<![A-Za-z])[Ww]e (try|aim|work|want) to (list|track|include|show|cover)(?![A-Za-z])|(?<![A-Za-z])like ours(?![A-Za-z])|(?<![A-Za-z])[Ww]e (currently |only |also |do |just )?"
        r"(list|track|show|feature|include|cover|help|connect|offer|built|started|let|make)(?![A-Za-z])|"
        r"[Ww]e('|’)ve listed|where we come in|(?<![A-Za-z])(through|with|from|via) us(?![A-Za-z])|[Ww]e (don't|don’t|do not) (currently )?(have|list|show|track)"
        r"[^.]{0,60}(listed|directory|site|track)|[Ww]e('|’)re (working|adding|building|growing|still adding))")

# --------------------------------------------------------------------------- narrator sentence classes
# FOUNDER: a singular narrator speaking as the company's founder or as the company ("I started
# PoolRentalNearMe.com", "my company", "our members"). Nobody real said these words (CLAUDE.md rule 1).
FOUNDER = (r"(?i)(poolrentalnearme|pool rental near me|(?<![a-z])my (company|site|website|business|platform|team)"
           r"(?![a-z])|(?<![a-z])our (members|customers|hosts|guests|users|company|team|platform)(?![a-z])|"
           r"(?<![a-z])i('ve|’ve)? (started|built|founded|created|launched)(?![a-z])|in (this|the pool) business|"
           r"connecting (people|folks|swimmers) with|i('ve|’ve) sent (a lot of )?(people|folks))")
# GAP: the narrator says what it does not know. Never informative.
GAP = (r"(?i)((my|our) (information|info|data|records|details|sources|system|notes)|"
       r"(^|[^a-z])i (also |just |really |still |simply |currently |unfortunately )?(don't|don’t|do not|can't|can’t|cannot|couldn't|couldn’t|didn't|didn’t|"
       r"haven't|haven’t|have no|wasn't able|wasn’t able|was unable|am unable|only have|have only|"
       r"could not|did not)(?![a-z])|i('m|’m) (not (sure|aware|certain|able)|unable)|"
       r"the (information|info|data|details) i (have|found|see|could find)|"
       r"(isn't|isn’t|aren't|aren’t|is not|are not|not) something i|not in my)")
# A GAP sentence must also say that something is missing or limited ("My notes say they have passes" is a
# fact report, not a gap). Added 2026-11-16 after the second live validation sample.
GAP_NEG = (r"(?i)(n't|n’t|(?<![a-z])(not|no|only|limited|unable|never|nothing|without|none)(?![a-z]))")
# A gap whose only "missing" word is a limiter (only / limited) says what IS known ("I only have data on this
# facility being free"). Such a sentence is kept when it carries fact vocabulary. Added 2026-11-16 (review).
GAP_HARD = (r"(?i)(n't|n’t|(?<![a-z])(not|no|unable|never|nothing|without|none)(?![a-z]))")
# ADVICE: the narrator tells the reader to call / check / go early. Anchored at the sentence start,
# allowing a short non-assertive lead-in ("For parking details, ...", "If you're unsure, ...").
LEAD_IN = (r"((yes|no|honestly|personally|again|also|still|so|otherwise|either way|in any case|just|overall|"
           r"that said|for (details|specifics|more|the most|current|up-to-date|accurate|exact|other|specific|"
           r"anything)[^,.]{0,80}|(if|when|before|to)[^,.]{0,100}),?" + WS + r"+)?")
ADVICE = (r"(?i)^" + LEAD_IN +
          r"(i('d|’d| would)( definitely| still| probably| also| personally| always| really| strongly|"
          r" just| highly| first)?" + WS + r"+(suggest|recommend|call|check|give|reach|contact|look|lean|ask|confirm|"
          r"verify|double-check|visit|plan|try|head|arrive|go|bring|pack|start|scout|stick|search|email|phone|"
          r"stop by|swing by|get in touch|say give|say call|say check)|"
          r"i (always |usually |generally |strongly |personally |highly |would |also |just )?"
          r"(recommend|suggest|advise|encourage|tell (people|folks|everyone|you|visitors|families|anyone) to)|"
          r"my (advice|suggestion|recommendation|tip|go-to)|"
          r"if i were you)(?![a-z])")
# Non-narrator generic referral, used only to decide whether a WHOLE FAQ answer is non-informative.
GENERIC_ADVICE = (r"(?i)^" + LEAD_IN +
                  r"(your best bet is|it('s|’s| is) (always |probably |usually |generally )?(best|a good idea|"
                  r"smart|wise|worth|safest|good) to|it never hurts to|you('ll|’ll)? (should|can|could|might|"
                  r"may|would|will)? ?(want to |need to |also |always |definitely )?(call|check|contact|visit|"
                  r"confirm|ask|refer|look|reach|verify|find|search|try)|(call|check|contact|visit|confirm|ask|look|"
                  r"reach|verify|search|try|give them)(?![a-z])|a quick (call|search|look|check)|"
                  r"calling (ahead|them|the)|checking (their|the|with))")
GENERIC_GAP = (r"(?i)^(the |their )?(listing|information|info|data|details|website|site|source|page)s? "
               r"(doesn't|doesn’t|does not|don't|don’t|didn't|didn’t|isn't|isn’t|aren't|"
               r"aren’t) (specify|mention|list|include|show|say|have|provide|give)(?![a-z])")

# --------------------------------------------------------------------------- fact guards
# A deletable sentence must assert nothing that could be a real fact about the pool.
# "the only one" is NOT masked (revised 2026-11-16): "X is the only one I show in my system" is an inventory claim.
NUM_MASK = (r"(?i)((this|that|the|which|each|any|no|every|some|another|other|a good|a great|a solid|a nice|"
            r"a popular|a fun|a decent) one(?![a-z])|(?<![a-z])one of|someone|anyone|everyone|"
            r"no one|one-stop)")
NUMERIC = (r"(?i)[0-9$%]|(?<![a-z])(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|"
           r"fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|"
           r"eighty|ninety|hundred|thousand|million|dozen|dozens|half|single|couple|pair|once|twice|"
           r"first|second|third)(?![a-z])")
URL = r"(?i)(www\.|https?://|@|\.(com|org|gov|net|edu|us)(?![a-z]))"
# Clauses that usually carry an assertion ("I'd call, since they close early") or join two sentences.
CLAUSE = (r"(?i)(?<![a-z])(but|however|although|though|while|whereas|yet|except|since|because|given|which|"
          r"unless|so that)(?![a-z])|;|:|—|–| - |, (and |so )?(it|its|it's|it’s|they|they're|"
          r"they’re|their|the pool|there|this|that)(?![a-z])")
# A narrator clause spliced onto another clause with a comma ("It's not too far from Decatur, I'd say ...")
# hides an assertion. Allowed only when everything before the comma is a non-assertive lead-in.
COMMA_SPLICE = (r"," + WS + r"+(and |so |but |then |plus )?(I|I'd|I’d|I'm|I’m|I've|I’ve|I'll|I’ll|[Mm]y|[Ww]e|[Ww]e're|[Ww]e’re|"
                r"[Ww]e've|[Ww]e’ve)(?![A-Za-z])")
SPLICE_OK = (r"(?i)^(yes|no|honestly|personally|again|also|still|so|otherwise|either way|in any case|just|overall|"
             r"that said|for [^,.]{0,80}|(if|when|before|to|from what)[^,.]{0,100})," + WS + r"+(i|i'd|i’d|i'm|i’m|"
             r"i've|i’ve|i'll|my|we)(?![a-z])[^,]*$")
# A sentence that opens with the answer's polarity carries the answer itself ("Yes, I think so.").
POLARITY = r"(?i)^(yes|no|nope|yep|yeah|absolutely|definitely|unfortunately|sadly|sure|certainly)(?![a-z])"
# Vocabulary of real pool facts: price, rating, amenities, pool type, hours/schedule.
LEX_PRICE_SCHEDULE = (r"(?i)(?<![a-z])(free|no charge|no cost|cheap|inexpensive|affordable|pricey|expensive|"
           r"bucks?|dollars?|admission|fees?|prices?|pricing|costs?|rates?|open|opens|opened|closed|closes|closing|hours|"
           r"daily|weekdays?|weekends?|mondays?|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?|sundays?|"
           r"year-round|year round|all year|seasonal|memorial day|labor day|january|february|march|april|june|"
           r"july|august|september|october|november|december|mornings?|evenings?|night|noon|midnight|residents?|"
           r"members?|membership|passes|day pass|season pass|(late|early|mid|in|by|from|through|until|of)[ -]may|"
           r"may (through|to|until|and))(?![a-z])")
LEXICON = (r"(?i)(?<![a-z])(ratings?|rated|stars?|reviews?|reviewers?|reviewed|score|slides?|"
           r"waterslides?|diving|dive|boards?|laps?|lanes?|splash|lazy river|wading|kiddie|toddlers?|shallow|"
           r"deep end|heated|indoors?|outdoors?|open-air|olympic|competition|hot tub|spa|sauna|jacuzzi|lockers?|"
           r"locker rooms?|showers?|changing rooms?|restrooms?|concessions?|snack bar|picnic|shade|shaded|"
           r"cabanas?|lifeguards?|parking|accessible|accessibility|ada|wheelchair|lift|lessons?|aerobics|"
           r"water polo|fountains?|playground|zero-entry|zero-depth|beach entry|wave pool|grills?|bbq|"
           r"diving well|water ?park|fitness|gym|tennis|"
           # added 2026-11-16 (review: deleted sentences carried these facts)
           r"timing( system)?|touchpads?|scoreboards?|seating|seats?|spectators?|bleachers|grandstands?|"
           r"enclosed|warm-up|warmup|therapy|therapeutic|whirlpool|steam room|climbing wall|rope swing|"
           r"deck|sun ?deck|splash ?pads?|spray ?grounds?|water features?|play structures?|"
           r"(kids|kids'|kids’|kid|children's|children’s|toddler|play|baby|family|shallow) (area|section|zone|pool)s?|"
           # fact markers: the sentence says the pool HAS something
           r"(like|as|which|that) this one (does|has|offers|is)|(they|it) even (has|have|offer|offers|got)|"
           r"(they|they've|they’ve) (even )?got)(?![a-z])")
INSURANCE = (r"(?i)(?<![a-z])(insur[a-z]*|liabilit[a-z]*|liable|coverage|covered|covers?|claims?|claimed|"
             r"damag[a-z]*)(?![a-z])")
# Sentence openers that point back to the previous sentence. If the sentence that would follow a
# deleted sentence starts with one of these, deleting would leave a broken reference: skip the row.
DANGLING_OPENER = (r"^((So|Plus|Also|But|And|Or|Still|However|Though|Although|Otherwise|Then|Yet|Even|That|"
                   r"That's|That’s|This|These|Those|Which|It|It's|It’s|Its|They|They're|They’re|"
                   r"They've|They’ve|They'll|They’ll|Their|Them|There|There's|There’s|He|She|Both|"
                   r"Either|Neither|Anyway|Besides|Again|Instead|Thus|Hence|Therefore|Because|Since|Too|Such|Same|"
                   r"Other|Another|Others|"
                   # added 2026-11-16 (review: these follow a deleted subject sentence and read as fragments)
                   r"Lots|Plenty|Think|Just|Things|Not|Nothing|Mostly|Mainly|Usually|"
                   r"Especially|Whether|Like|Kind|Sort|Great|Good|Perfect|Tons|Loads)(?![A-Za-z'’])|"
                   # quantifier used as a pronoun ("Some are more about laps"): its noun was in the sentence before
                   r"(Some|Many|Most|Few|All|Each|Several|A few|A lot) (are|is|have|has|of|offer|offers|seem|tend|"
                   r"will|can|do|does|lean|focus|cater|get|come|run|stay|open|close)(?![A-Za-z'’])|[a-z]|[A-Z][^,.]{0,40}, (that|this|these|those|it|"
                   r"it's|it’s|they|they're|they’re|there|so|then)(?![A-Za-z'’]))")
# A capitalised word that is not the first word, not "I", and not part of the row's own pool name,
# city name or state name, names an entity the following sentence may refer back to.
CAPWORD = r"[A-Z][a-z]"
# For a deleted sentence that is the LAST kept context of its field (added 2026-11-16, review finding "entity
# guard only runs when another sentence follows"): it is skipped when it names an entity, except that the
# site's own name and the words of a generic agency referral ("the City of Dayton Parks and Recreation
# website") do not count. A named facility ("the Vancouver Aquatic Center", "Skyline Aquatic Center",
# "Pulaski and Schulz") still does.
ENTITY_EXEMPT_LAST = (r"(PoolRentalNearMe|Pool ?Rental ?Near ?Me|(?<![A-Za-z])(City|County|Town|Village|Township|"
                      r"Borough|Parks?|Recreation|Rec|Department|Dept|Services|Cultural|Arts|Resources|Community|"
                      r"Leisure|Boys|Girls|Clubs?|Google|Maps|Yelp|Facebook|Website|Office|Aquatics|Division|"
                      r"District|Authority|Government|Official)(?![A-Za-z]))")

# --------------------------------------------------------------------------- pool counts (R6)
NUMBER_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8,
                "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
                "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
                "a single": 1, "a pair of": 2}
COUNT_NUM = (r"([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|"
             r"fifteen|sixteen|seventeen|eighteen|nineteen|twenty|a single|a pair of)")
# "<number> (public|city|municipal|...) (swimming )?pools", "only one public option", "lists five public pools".
COUNT = (r"(?i)(?<![a-z0-9.,$])" + COUNT_NUM +
         r"(?![a-z0-9])(( (?!(of|reviews?|stars?|people|residents|minutes|miles|months|years|degrees|feet|meters?|"
         r"yards?|hours|days|weeks|times|percent|lanes?)(?![a-z]))[a-z-]+){0,3}?) (pools|pool|options|option|facilities|facility|spots|spot|"
         r"locations|location|aquatic centers|aquatic center|swimming spots)(?![a-z])")
# Second form, without a noun: "We've got four listed in our directory", "The single public pool we list".
COUNT2 = (r"(?i)(?<![a-z0-9.,$])([0-9]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|single)"
          r"(?![a-z0-9])( public)? (listed|in our directory|on our site|we list|we track)(?![a-z])")
COUNT_VAGUE = (r"(?i)(?<![a-z])(a couple|a few|a handful|several|a decent number|a good number|plenty)( of)?"
               r"( [a-z-]+){0,2}? (pools|options|facilities|spots|listed)(?![a-z])")
# A stated number is about the city's directory inventory only if the sentence also says so.
COUNT_SCOPE = (r"(?i)(we('ve| have)? (got|track|list|have)|our (directory|site|listings?)|(directory|site) "
               r"(lists|shows|has)|listed|we track|public|city-run|municipal|in (town|the city)|"
               r"there('s|’s| is| are) (only|just)|only|just)")


# Added 2026-11-16 (R6). Zero counts, "just the one", and the narrower test that a sentence is about the
# directory's own inventory. Only sentences that pass DIRECTORY_SCOPE can be deleted automatically.
COUNT_ZERO = (r"(?i)((?<![a-z])we (don't|don’t|do not) (currently |yet |really )?(have|list|track|show) any|"
              r"(?<![a-z])there are no|(?<![a-z])we have no)( public)?( swimming)? (pools|options|facilities|"
              r"spots|locations)(?![a-z])")
COUNT_THE_ONE = r"(?i)(?<![a-z])(just|only) (the|that) one(?![a-z])"
COUNT_THE_ONLY = (r"(?i)(?<![a-z])(the|our) (single|only|sole|lone)( listed)?( public)? (pool|option|spot|facility|"
                  r"location)(?![a-z])")
DIRECTORY_SCOPE = (r"(?i)(director(y|ies)|(?<![a-z])listed(?![a-z])|(?<![a-z])listings?(?![a-z])|"
                   r"(?<![a-z])we (list|track)(?![a-z])|on our (site|website)|our (site|website|system) "
                   r"(lists|shows|has)|in our system|(?<![a-z])we('ve|’ve| have) got(?![a-z]))")
# Words between the number and the noun that narrow the claim to a sub-type ("one public OUTDOOR pool").
# A sub-type count cannot be compared with the page's total, so it is never automatic.
COUNT_SUBTYPE = (r"(?i)(?<![a-z])(indoor|outdoor|free|kids?|family|big|main|good|city|municipal|olympic|"
                 r"competition|lap|heated|year-round|nude|clothing-optional|waterpark)(?![a-z])")
# A count sentence that also says what a facility offers or is like carries a claim beyond the count.
COUNT_CLAIM = (r"(?i)(?<![a-z])(offers?|offering|features?|includes?|including|requires?|known|designed|"
               r"family-friendly|kid-friendly|caters?|geared|specializ[a-z]*|famous|"
               # added 2026-11-16 (review): "covering everything from ...", "plus lots of backyard pools"
               r"plus|covering|ranging|ranges?|everything|variety|mix|types?|kinds?|sizes?|across)(?![a-z])")
COUNT_LOOSE_SCOPE = r"(?i)(?<![a-z])(public|only|just|city-run|municipal|all)(?![a-z])"


def pg(s):
    """Quote a Python string as a PostgreSQL literal (standard_conforming_strings=on)."""
    return "'" + s.replace("'", "''") + "'"


# --------------------------------------------------------------------------- reference cleaner
def split_sentences(text):
    protected = re.sub(ABBREV, lambda m: m.group(1) + ABBREV_MARK, text)
    return [p.replace(ABBREV_MARK, ".") for p in re.split(SPLIT, protected) if p != ""]


def is_narrator(s):
    masked = re.sub(ROMAN_I, lambda m: m.group(1) + " _", s)
    sing = re.search(SING, masked) is not None
    plur = re.search(PLUR, masked) is not None
    local = re.search(LOCAL, masked) is not None
    if sing:
        return "singular"
    if (plur or local) and re.search(SITE, masked):
        return None  # site voice
    if plur:
        return "plural"
    if local:
        return "local"
    return None


def has_number(s):
    return re.search(NUMERIC, re.sub(NUM_MASK, "X", s)) is not None


def strip_names(s, names):
    # Fixed order (pool name, city, state), identical to the SQL replace() chain.
    for n in names:
        if n:
            s = s.replace(n, " ")
    return s


def has_entity(s, names, last=False):
    rest = s.split(" ", 1)[1] if " " in s else ""
    rest = re.sub(SING, " ", strip_names(rest, names))
    if last:
        rest = re.sub(ENTITY_EXEMPT_LAST, " ", rest)
    return re.search(CAPWORD, rest) is not None


def classify(s, pool_page=False):
    """Return (narrator_kind, sentence_class, deletable_if_context_allows, reason)."""
    kind = is_narrator(s)
    if kind is None:
        if re.search(GENERIC_ADVICE, s) or re.search(GENERIC_GAP, s):
            ok = not (has_number(s) or re.search(URL, s) or re.search(CLAUSE, s))
            return None, "generic_noninformative" if ok else "generic_with_fact", False, None
        return None, "other_text", False, None
    if re.search(INSURANCE, s):
        return kind, "insurance", False, "mentions insurance/liability/coverage/claims/damage"
    if kind == "singular" and re.search(FOUNDER, s):
        # every clause of an invented founder statement is invented: number/URL/clause guards do not apply
        if re.search(LEXICON, s) or re.search(LEX_PRICE_SCHEDULE, s):
            return kind, "founder", False, "fact_vocabulary"
        if re.search(POLARITY, s):
            return kind, "founder", False, "answer_polarity"
        return kind, "founder", True, None
    if kind == "local" and pool_page:
        return kind, "opinion", False, "local_marker_on_pool_page"
    cls = ("gap" if re.search(GAP, s) and re.search(GAP_NEG, s) else "advice" if re.search(ADVICE, s)
           else "opinion")
    if has_number(s):
        return kind, cls, False, "number"
    if re.search(URL, s):
        return kind, cls, False, "url_or_contact"
    if re.search(CLAUSE, s) or (re.search(COMMA_SPLICE, s) and not re.search(SPLICE_OK, s)):
        return kind, cls, False, "second_clause"
    if re.search(POLARITY, s):
        return kind, cls, False, "answer_polarity"
    # gap only says what is unknown, so topic words may stay; advice can imply that an amenity exists
    # ("I'd check out the lazy river"); opinion can imply anything.
    if cls in ("advice", "opinion") and re.search(LEXICON, s):
        return kind, cls, False, "fact_vocabulary"
    if cls == "opinion" and re.search(LEX_PRICE_SCHEDULE, s):
        return kind, cls, False, "fact_vocabulary"
    if cls == "gap" and not re.search(GAP_HARD, s) and (re.search(LEXICON, s) or re.search(LEX_PRICE_SCHEDULE, s)):
        return kind, cls, False, "fact_vocabulary"   # "I only have data on this facility being free"
    return kind, cls, True, None


# --------------------------------------------------------------------------- R6 count statements
def _num(w):
    w = w.lower()
    if w.isdigit():
        return int(w)
    if w == "single":
        return 1
    return NUMBER_WORDS.get(w)


def count_hit(s):
    """First pool-count statement in sentence s: dict(form, stated, between, phrase) or None."""
    m = re.search(COUNT, s)
    if m:
        return {"form": "number+noun", "stated": _num(m.group(1)), "between": m.group(2).strip(),
                "phrase": m.group(0)}
    m = re.search(COUNT2, s)
    if m:
        return {"form": "number+listed", "stated": _num(m.group(1)), "between": "", "phrase": m.group(0)}
    m = re.search(COUNT_ZERO, s)
    if m:
        return {"form": "zero", "stated": 0, "between": "", "phrase": m.group(0)}
    m = re.search(COUNT_THE_ONE, s) or re.search(COUNT_THE_ONLY, s)
    if m and re.search(DIRECTORY_SCOPE, s):
        return {"form": "the_one", "stated": 1, "between": "", "phrase": m.group(0)}
    return None


def r6_classify(s, actual, distinct_after_duplicates=None):
    """Category of a sentence for R6 given the page's published-pool count.

    auto            states a different count for the directory and nothing else that could be a fact:
                    deleted (subject to the field-level skips)
    review_mixed    directory count is wrong, but the sentence also carries other claims (names an amenity,
                    price, schedule, another number or a URL): listed for the owner, never automatic
    review_subtype  count of a sub-type ("one public outdoor pool"): listed, never automatic
    review_scope    a count that may be about the directory but has no directory word: listed
    hold_duplicate  stated count equals the number of facilities once mapped duplicates are merged: held
                    until the duplicate decision
    vague           "a few listed", "only a couple listed": listed, never automatic
    skip_insurance  never touched
    consistent / not_inventory / None"""
    h = count_hit(s)
    if h is None:
        if re.search(COUNT_VAGUE, s) and re.search(DIRECTORY_SCOPE, s):
            return "vague", None
        return None, None
    if h["stated"] == actual:
        return "consistent", h
    if not re.search(DIRECTORY_SCOPE, s):
        if h["form"] == "number+noun" and re.search(COUNT_LOOSE_SCOPE, s):
            return "review_scope", h
        return "not_inventory", h
    if re.search(INSURANCE, s):
        return "skip_insurance", h
    if distinct_after_duplicates is not None and h["stated"] == distinct_after_duplicates:
        return "hold_duplicate", h
    if re.search(COUNT_SUBTYPE, h["between"]):
        return "review_subtype", h
    rest = s.replace(h["phrase"], " ")
    if (re.search(LEXICON, rest) or re.search(LEX_PRICE_SCHEDULE, rest) or re.search(URL, rest)
            or re.search(COUNT_CLAIM, rest) or has_number(rest) or re.search(CLAUSE, rest)):
        return "review_mixed", h
    return "auto", h


# --------------------------------------------------------------------------- field planner (R2/R3/R4/R6)
def field_has_insurance(text, pool_page=False, actual=None, distinct=None):
    """True if any narrator sentence or any count statement of the field mentions insurance/liability/
    coverage/claims/damage. Such a field is never touched by any rule (reported)."""
    for s in split_sentences(text):
        if is_narrator(s) is not None and re.search(INSURANCE, s):
            return True
        if actual is not None and r6_classify(s, actual, distinct)[0] == "skip_insurance":
            return True
    return False


def _pass(text, names, pool_page, rule, actual=None, distinct=None):
    """One rule pass over one field: (new_text, [(rule, deleted_sentence)], skip_reason).
    rule == "R6" deletes 'auto' count sentences; any other rule label deletes deletable narrator
    sentences. On a skip the text is returned unchanged."""
    sents = split_sentences(text)
    marks = [None] * len(sents)
    for i, s in enumerate(sents):
        if rule == "R6":
            if r6_classify(s, actual, distinct)[0] == "auto":
                marks[i] = rule
        else:
            kind, cls, ok, why = classify(s, pool_page)
            if kind is not None and ok:
                marks[i] = rule
    dels = [(m, s) for m, s in zip(marks, sents) if m]
    if not dels:
        return text, [], None
    if all(marks):
        return text, dels, "field_would_be_empty"
    for i, (s, d) in enumerate(zip(sents, marks)):
        if not d:
            continue
        nxt = next((sents[j] for j in range(i + 1, len(sents)) if not marks[j]), None)
        if nxt is not None and re.search(DANGLING_OPENER, nxt):
            return text, dels, "next_sentence_refers_back"
        if has_entity(s, names, last=nxt is None):   # revised 2026-11-16: the last sentence too (it may be the
            return text, dels, "deleted_sentence_names_an_entity"   # only mention of a named facility)
    return rebuild(text, sents, marks), dels, None


def plan_field(text, names, pool_page=False, actual=None, distinct=None, narr_rule=None):
    """Plan the deletions for ONE prose field (a description, an intro, one FAQ answer).

    Passes run in order: R6 (only when the page's published count `actual` is given), then the narrator
    rule (R2 on pool pages, R4 on city pages, R3 when called for pool FAQ answers). Each pass is checked
    on the text the previous pass left; a pass that would empty the field or leave a sentence pointing at
    a deleted one is skipped as a whole and reported, without blocking the other pass.

    Returns dict: after (text, or None when nothing changes), deleted [(rule, sentence)],
    skips {rule: reason}, r6 [(category, hit, sentence)] for every count statement found."""
    narr_rule = narr_rule or ("R2" if pool_page else "R4")
    r6 = []
    if actual is not None:
        for s in split_sentences(text):
            cat, h = r6_classify(s, actual, distinct)
            if cat not in (None, "consistent", "not_inventory"):
                r6.append((cat, h, s))
    res = {"after": None, "deleted": [], "skips": {}, "r6": r6}
    if field_has_insurance(text, pool_page, actual, distinct):
        res["skips"]["ALL"] = "insurance"
        return res
    cur = text
    for rule in (["R6"] if actual is not None else []) + [narr_rule]:
        new, dels, why = _pass(cur, names, pool_page, rule, actual, distinct)
        if why:
            res["skips"][rule] = why
        elif dels:
            cur = new
            res["deleted"] += dels
    if res["deleted"]:
        res["after"] = cur
    return res


def clean_text(text, names, pool_page=False):
    """Back-compatible wrapper (narrator rule only): (new_text, deleted_sentences, skip_reason)."""
    p = plan_field(text, names, pool_page)
    why = next(iter(p["skips"].values()), None)
    if p["after"] is None:
        return text, [], why
    return p["after"], [s for _, s in p["deleted"]], why


def rebuild(text, sents, marks):
    """Remove deleted sentences while keeping the original whitespace between kept sentences."""
    protected = re.sub(ABBREV, lambda m: m.group(1) + ABBREV_MARK, text)
    pieces = re.split("(" + SPLIT + ")", protected)
    sentences = pieces[0::2]   # pieces alternate sentence, separator, sentence, ...
    seps = pieces[1::2]
    assert len(sentences) == len(marks), "sentence split mismatch"
    keep = [(i, s.replace(ABBREV_MARK, ".")) for i, (s, d) in enumerate(zip(sentences, marks)) if not d]
    res = ""
    for k, (i, s) in enumerate(keep):
        if k > 0:
            res += seps[i - 1]  # the separator that preceded this kept sentence in the original
        res += s
    return res


# --------------------------------------------------------------------------- R5 (FAQ entries)
def answer_is_noninformative(a, pool_page=False):
    """True when EVERY sentence is a deletable narrator sentence or a generic referral / data-gap sentence
    with no number, URL or second clause, and at least one sentence is narrator."""
    narr = 0
    for s in split_sentences(a):
        kind, cls, ok, _ = classify(s, pool_page)
        if kind is not None:
            if not ok:
                return False
            narr += 1
        elif cls != "generic_noninformative":
            return False
    return narr > 0


def _plain_entry(e):
    return isinstance(e, dict) and isinstance(e.get("a"), str) and not (set(e) & {"a2", "a3", "a4", "a5"})


def plan_faqs(faqs, names, pool_page=False, actual=None, distinct=None):
    """R5, then R6, then R3 (pool) / R4 (city) over one ai_faqs array (list of dicts).

    Only the 'a' value of an entry is ever changed; every other key of an entry is kept unchanged; entries
    whose 'a' is not a string or that carry a2..a5 keys are never touched. The unit of a sentence pass is
    the whole array: if any answer fails a pass's checks, that pass changes no answer of this row.
    Returns (new_list or None, report)."""
    rep = {"r5_deleted": [], "r5_skip": None, "sent_deleted": [], "skips": {}, "r6": []}
    if not isinstance(faqs, list) or not faqs:
        return None, rep
    keep = []
    for e in faqs:
        if not _plain_entry(e):
            keep.append(e)
            continue
        if answer_is_noninformative(e["a"], pool_page):
            q = e.get("q")
            if re.search(INSURANCE, e["a"]) or (isinstance(q, str) and re.search(INSURANCE, q)):
                rep["r5_skip"] = "insurance"
                keep.append(e)
            else:
                rep["r5_deleted"].append(e)
            continue
        keep.append(e)
    if rep["r5_deleted"] and not any(_plain_entry(e) for e in keep):
        rep["r5_skip"], rep["r5_deleted"], keep = "array_would_be_empty", [], list(faqs)
    cur = [dict(e) if isinstance(e, dict) else e for e in keep]
    for e in cur:
        if _plain_entry(e) and actual is not None:
            for s in split_sentences(e["a"]):
                cat, h = r6_classify(s, actual, distinct)
                if cat not in (None, "consistent", "not_inventory"):
                    rep["r6"].append((cat, h, s))
    if any(_plain_entry(e) and field_has_insurance(e["a"], pool_page, actual, distinct) for e in cur):
        rep["skips"]["ALL"] = "insurance"
    else:
        narr = "R3" if pool_page else "R4"
        for rule in (["R6"] if actual is not None else []) + [narr]:
            results = [(_pass(e["a"], names, pool_page, rule, actual, distinct) if _plain_entry(e) else None)
                       for e in cur]
            why = next((r[2] for r in results if r and r[2]), None)
            if why:
                rep["skips"][rule] = why
                continue
            for e, r in zip(cur, results):
                if r and r[1]:
                    e["a"] = r[0]
                    rep["sent_deleted"] += r[1]
    changed = bool(rep["r5_deleted"]) or bool(rep["sent_deleted"])
    return (cur if changed else None), rep


# --------------------------------------------------------------------------- R1
def best_for_reformat(raw):
    """R1: '["a", "b"]' -> 'a, b'. Returns (new, skip_reason)."""
    if raw is None:
        return None, "null"
    try:
        v = json.loads(raw)
    except ValueError:
        return raw, "not_json"
    if not isinstance(v, list):
        return raw, "not_a_list"
    if len(v) == 0:
        return raw, "empty_list"
    if not all(isinstance(x, str) and x.strip() and not re.search(r"[,\[\]{}\"<>\\]", x) for x in v):
        return raw, "element_not_plain_text"
    if re.search(INSURANCE, raw):
        return raw, "insurance"
    return ", ".join(v), None


# --------------------------------------------------------------------------- rules.json
def rules():
    common_skip = [
        {"id": "insurance", "pattern": INSURANCE,
         "skip": "the whole column of the row is left untouched and reported if any sentence the rule would "
                 "delete, or any narrator sentence in the field, matches"},
        {"id": "number", "pattern": NUMERIC, "pre_mask": NUM_MASK,
         "skip": "sentence is kept (not deletable) if it contains a digit, $, % or number word"},
        {"id": "url_or_contact", "pattern": URL, "skip": "sentence is kept"},
        {"id": "second_clause", "pattern": CLAUSE, "also": {"comma_splice": COMMA_SPLICE, "splice_ok": SPLICE_OK},
         "skip": "sentence is kept: a second clause usually carries an assertion"},
        {"id": "answer_polarity", "pattern": POLARITY,
         "skip": "sentence is kept: it opens with the answer itself (\"Yes, I think so.\")"},
        {"id": "fact_vocabulary", "pattern": LEXICON, "price_schedule_pattern": LEX_PRICE_SCHEDULE,
         "skip": "advice/opinion sentence is kept if it names an amenity/rating/type; opinion sentence is also "
                 "kept if it names a price or schedule word"},
        {"id": "local_marker_on_pool_page",
         "skip": "a sentence whose only narrator signal is local voice (\"folks here\") is kept on pool pages"},
        {"id": "dangling_next", "pattern": DANGLING_OPENER,
         "skip": "row (for this column) is skipped and reported if the first kept sentence after a deleted one "
                 "matches (it would point back at a deleted sentence)"},
        {"id": "entity_then_more", "pattern": CAPWORD,
         "skip": "row (for this column) is skipped and reported if a deleted sentence that is not the last kept "
                 "context contains a capitalised word other than its first word, I-forms, the pool name, the "
                 "city name or the state name"},
        {"id": "field_would_be_empty",
         "skip": "row (for this column) is skipped and reported if every sentence of a field would be deleted"},
    ]
    narrator = {"split": {"protect_abbrev": ABBREV, "mark": ABBREV_MARK, "split": SPLIT},
                "roman_numeral_mask": ROMAN_I, "singular": SING, "plural": PLUR, "local_insider": LOCAL,
                "site_voice_exempt_if_no_singular": SITE,
                "classes": {"founder": FOUNDER, "gap": GAP, "gap_requires": GAP_NEG, "advice": ADVICE,
                            "opinion": "any other narrator sentence"},
                "founder_note": "an invented founder/company sentence is deletable even with a second clause, "
                                "number or URL; it is still kept if it carries fact vocabulary or answer polarity"}
    return {
        "version": "2026-11-16",
        "status": "PREPARED, NOT APPLIED. Owner approval required. Apply only after the pp-ssr source is "
                  "under version control. Whether pp-ssr reads this database live is UNVERIFIED (one row "
                  "matched its live page byte for byte; live pages on 2026-11-16 match these fields).",
        "source_of_truth": "text-defects/text_defect_rules.py (this file is generated by "
                           "`python3 -I text_defect_rules.py rules`)",
        "regex_dialect": "Python re and PostgreSQL ARE (identical behaviour; (?i) prefix = case-insensitive)",
        "operations_allowed": ["delete_sentence", "delete_faq_entry", "reformat_list"],
        "never": ["compose, paraphrase or reorder text", "change a number", "touch a FAQ question",
                  "touch a sentence about insurance, liability, coverage, claims or damage",
                  "merge, delete or unpublish a record"],
        "order": ["R1", "R5", "R6", "R2", "R3", "R4"],
        "rules": [
            {"id": "R1", "column": "pp_pools.ai_best_for", "kind": "reformat_list",
             "match": "TEXT value that parses as a JSON array of non-empty strings",
             "action": "replace the value with the elements joined by ', ' in their original order and "
                       "spelling (no case change, no added or removed words)",
             "skip": [{"id": "null", "skip": "NULL: nothing to do"},
                      {"id": "empty_list", "skip": "'[]' would become an empty string: skip and report"},
                      {"id": "not_json", "skip": "skip and report"},
                      {"id": "element_not_plain_text", "pattern": r"[,\[\]{}\"<>\\]",
                       "skip": "an element contains a comma, quote, bracket or markup: skip and report"},
                      common_skip[0]],
             "note": "Data-side alternative to a renderer fix. If the captured pp-ssr source can render a JSON "
                     "array as a list, fix the renderer instead and do NOT apply R1 (both together are "
                     "harmless only if the renderer accepts plain text too)."},
            {"id": "R2", "column": "pp_pools.ai_description", "kind": "delete_sentence",
             "match": narrator, "skip": common_skip},
            {"id": "R3", "column": "pp_pools.ai_faqs[*].a", "kind": "delete_sentence",
             "match": narrator, "applies_after": "R5",
             "skip": common_skip + [{"id": "unit", "skip": "the unit is the row's whole ai_faqs array: one "
                                     "answer that fails a row-level skip leaves every answer of that row "
                                     "untouched (R5 deletions of whole entries still apply)"},
                                    {"id": "malformed_entry", "skip": "entries whose 'a' is not a string or "
                                     "that carry a2..a5 keys are never touched"}]},
            {"id": "R4", "column": "pp_cities.ai_intro, pp_cities.ai_faqs[*].a", "kind": "delete_sentence",
             "match": narrator, "applies_after": "R5, R6", "skip": common_skip},
            {"id": "R5", "column": "pp_pools.ai_faqs, pp_cities.ai_faqs", "kind": "delete_faq_entry",
             "match": {"answer_noninformative": "every sentence of the answer is either a deletable narrator "
                                                "sentence (R2 classes and sentence guards) or a non-narrator "
                                                "generic referral/data-gap sentence with no number, URL or "
                                                "second clause, and at least one sentence is narrator",
                       "generic_referral": GENERIC_ADVICE, "generic_gap": GENERIC_GAP},
             "action": "remove the whole entry object from the array; other entries keep their order and "
                       "their keys unchanged",
             "skip": [{"id": "insurance", "pattern": INSURANCE,
                       "skip": "entry kept if its question or answer matches"},
                      {"id": "array_would_be_empty", "skip": "no entry of the row is deleted; reported"}],
             "side_effect": "pp-ssr also prints ai_faqs as FAQPage JSON-LD; deleting an entry removes it there "
                            "too (observed on live pages 2026-11-16)"},
            {"id": "R6", "column": "pp_cities.ai_intro, pp_cities.ai_faqs[*].a", "kind": "delete_sentence",
             "match": {"count_number_noun": COUNT, "count_number_listed": COUNT2, "count_zero": COUNT_ZERO,
                       "count_the_one": COUNT_THE_ONE, "count_the_only": COUNT_THE_ONLY, "number_words": NUMBER_WORDS,
                       "directory_scope": DIRECTORY_SCOPE,
                       "condition": "the sentence states a number of pools for this city's directory "
                                    "(DIRECTORY_SCOPE matches) that differs from count(*) of pp_pools where "
                                    "city_id = the city and is_published (the number the page header prints)"},
             "action": "delete the sentence (the number is never rewritten)",
             "automatic_only_if": "category 'auto': no insurance word; no sub-type word between number and "
                                  "noun; no other number, URL, amenity, price or schedule word and no claim "
                                  "verb (COUNT_CLAIM: " + COUNT_CLAIM + ") in the rest of the sentence; stated count differs from the distinct-facility count after "
                                  "mapped duplicates",
             "listed_not_automatic": {"review_mixed": "wrong directory count plus other claims",
                                      "review_subtype": COUNT_SUBTYPE,
                                      "review_scope": "count with no directory word (COUNT_LOOSE_SCOPE: " +
                                                      COUNT_LOOSE_SCOPE + ")",
                                      "hold_duplicate": "stated count equals the facility count once mapped "
                                                        "duplicates (duplicate-mapping.csv SAME_FACILITY / "
                                                        "LIKELY_SAME) are merged",
                                      "vague": COUNT_VAGUE},
             "skip": [common_skip[0], common_skip[7], common_skip[8], common_skip[9]]},
        ],
        "not_rendered": {"pp_pools.ai_tips": "not printed on live pool pages or their JSON-LD (checked "
                                             "2026-11-16); no rule"},
    }


# --------------------------------------------------------------------------- tests
def run_tests(path=None):
    path = path or os.path.join(HERE, "examples.json")
    with open(path) as f:
        ex = json.load(f)["examples"]
    fails = 0
    for e in ex:
        rid, before, after = e["rule"], e["before"], e["after"]
        names = e.get("names", [])
        why = None
        if rid == "R1":
            got, why = best_for_reformat(before)
            if why:
                got = before
        elif rid == "R5":
            got = "delete_entry" if answer_is_noninformative(before["a"], e.get("pool_page", False)) else "keep_entry"
        else:
            p = plan_field(before, names, e.get("pool_page", rid in ("R2", "R3")), e.get("actual"),
                           e.get("distinct"), rid if rid in ("R2", "R3", "R4") else None)
            got = p["after"] if p["after"] is not None else before
            why = p["skips"].get(rid) or p["skips"].get("ALL")
        if got != after or (e.get("expect_skip") and e["expect_skip"] != why):
            fails += 1
            print("FAIL", rid, e.get("ref"), "\n  want:", after, "\n  got: ", got, "\n  skip:", why)
    counts = {}
    for e in ex:
        counts[e["rule"]] = counts.get(e["rule"], 0) + 1
    print(f"{len(ex)} examples {counts}, {fails} failures")
    return fails == 0


# --------------------------------------------------------------------------- live-page measurement
def _title(slug):
    return " ".join(w.capitalize() for w in slug.split("-"))


def _dup_merges(path):
    """city URL prefix -> number of records that disappear if mapped same-facility pairs were merged."""
    if not os.path.exists(path):
        return {}
    import csv
    parent = {}

    def find(x):
        while parent.setdefault(x, x) != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for r in csv.DictReader(open(path, encoding="utf-8")):
        if r["classification"] in ("SAME_FACILITY", "LIKELY_SAME") and r["a_http"] == "200" and r["b_http"] == "200":
            parent[find(r["a_url"])] = find(r["b_url"])
    comps = {}
    for u in list(parent):
        comps.setdefault(find(u), []).append(u)
    merges = {}
    for members in comps.values():
        city = "/".join(members[0].split("/")[:6]) + "/"
        merges[city] = merges.get(city, 0) + len(members) - 1
    return merges


def live(paths, outdir):
    """Apply every rule to the fields extracted from live pages (extract_live.py) and write a summary,
    the per-page planned deletions and the count-statement listing. Reads files only."""
    recs = []
    for p in paths:
        for line in open(p, encoding="utf-8"):
            recs.append(json.loads(line))
    merges = _dup_merges(os.path.join(PARENT, "duplicate-mapping.csv"))
    S = {"ALL": {}, "pages": {}, "R1": {}, "R2": {}, "R3": {}, "R4": {}, "R5": {}, "R6": {}, "kept_narrator": {},
         "narrator_pages": {"pool": 0, "city": 0}, "fetched_utc": [None, None], "faq_entries": {},
         "kept_examples": {}}
    plan_out, count_rows, ex_pool = [], [], []

    def inc(d, k, n=1):
        d[k] = d.get(k, 0) + n

    def record(field, deleted, skips, page):
        for rule, _ in deleted:
            inc(S[rule], field + "_sentences_deleted")
        for rule in sorted({rule for rule, _ in deleted}):
            inc(S[rule], field + "_rows_changed")
        if deleted:
            page["changes"].append([field, [[ru, d] for ru, d in deleted]])
        for rule, why in skips.items():
            inc(S["ALL" if rule == "ALL" else rule], field + "_rows_skipped_" + why)
        if skips:
            page["changes"].append([field + "_skipped", skips])
    for r in recs:
        kind = r["kind"]
        inc(S["pages"], kind + "_" + r["status"])
        if r["status"] != "200":
            continue
        t = r.get("fetched_utc")
        S["fetched_utc"][0] = min(filter(None, [S["fetched_utc"][0], t]))
        S["fetched_utc"][1] = max(filter(None, [S["fetched_utc"][1], t]))
        seg = r["url"].split("/")
        state = _title(seg[4])
        page = {"url": r["url"], "changes": []}
        narr_any = False
        if kind == "pool":
            names = [r.get("h1"), _title(seg[5]), state]
            bf = r.get("best_for")
            if bf is None:
                inc(S["R1"], "no_best_for_line")
            else:
                new, why = best_for_reformat(bf)
                inc(S["R1"], "skip_" + why if why else "reformat")
                if not why:
                    page["changes"].append(["R1", bf, new])
            fields = []
            if r.get("about"):
                fields.append(("R2", "\n\n".join(r["about"])))
            for k, s in fields:
                p = plan_field(s, names, True)
                record("desc", p["deleted"], p["skips"], page)
            faqs = r.get("faqs") or []
            new, rep = plan_faqs(faqs, names, True)
        else:
            m = re.match(r"Public Pools in (.*), ([^,]+)$", r.get("h1") or "")
            names = [None, m.group(1) if m else _title(seg[5]), m.group(2) if m else state]
            actual = r.get("header_count")
            prefix = "/".join(seg[:6]) + "/"
            distinct = actual - merges[prefix] if (actual is not None and prefix in merges) else None
            if r.get("list_count") is not None and actual is not None and r["list_count"] != actual:
                inc(S["R6"], "header_vs_list_mismatch")
            intro = r.get("intro") or ""
            p = plan_field(intro, names, False, actual, distinct) if intro else None
            if p:
                for cat, h, s in p["r6"]:
                    count_rows.append([r["url"], actual, distinct if distinct is not None else "", "intro", cat,
                                       h["stated"] if h else "", h["form"] if h else "", h["phrase"] if h else "", s])
                record("intro", p["deleted"], p["skips"], page)
            faqs = r.get("faqs") or []
            new, rep = plan_faqs(faqs, names, False, actual, distinct)
            for k, (cat, h, s) in enumerate(rep["r6"]):
                count_rows.append([r["url"], actual, distinct if distinct is not None else "", "faq", cat,
                                   h["stated"] if h else "", h["form"] if h else "", h["phrase"] if h else "", s])
        # FAQ column report (both kinds)
        if rep["r5_deleted"]:
            inc(S["R5"], kind + "_rows")
            inc(S["R5"], kind + "_entries", len(rep["r5_deleted"]))
            page["changes"].append(["R5", [[e.get("q"), e.get("a")] for e in rep["r5_deleted"]]])
        if rep["r5_skip"]:
            inc(S["R5"], kind + "_skip_" + rep["r5_skip"])
        record("faq", rep["sent_deleted"], rep["skips"], page)
        # narrator presence and the out-of-scope (kept) narrator sentences
        texts = []
        if kind == "pool" and r.get("about"):
            texts += [("desc", s) for s in split_sentences("\n\n".join(r["about"]))]
        if kind == "city" and r.get("intro"):
            texts += [("intro", s) for s in split_sentences(r["intro"])]
        for e in faqs:
            if isinstance(e.get("a"), str):
                texts += [("faq", s) for s in split_sentences(e["a"])]
                narr_e = any(classify(s, kind == "pool")[0] is not None for s in split_sentences(e["a"]))
                inc(S["faq_entries"], kind + "_total")
                if narr_e:
                    inc(S["faq_entries"], kind + "_with_narrator")
                    if answer_is_noninformative(e["a"], kind == "pool"):
                        inc(S["faq_entries"], kind + "_noninformative")
                    else:
                        inc(S["faq_entries"], kind + "_narrator_plus_fact")
        for where, s in texts:
            k2, cls, ok, why = classify(s, kind == "pool")
            if k2 is not None:
                narr_any = True
                if not ok:
                    key = f"{kind}.{where}:{cls}:{why}"
                    inc(S["kept_narrator"], key)
                    if len(S["kept_examples"].setdefault(key, [])) < 2 and len(s) < 220:
                        S["kept_examples"][key].append(s)
        if narr_any:
            inc(S["narrator_pages"], kind)
        if page["changes"]:
            plan_out.append(page)
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "live-summary.json"), "w") as f:
        json.dump(S, f, indent=1, sort_keys=True)
    with open(os.path.join(outdir, "live-planned-changes.jsonl"), "w") as f:
        for p in plan_out:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")
    import csv
    with open(os.path.join(outdir, "count-statements.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["city_url", "page_count", "distinct_after_mapped_duplicates", "field", "category", "stated",
                    "form", "phrase", "sentence"])
        for row in sorted(count_rows, key=lambda x: (x[4], x[0])):
            w.writerow(row)
    return S


TAILS = {
    "by_class": """select col, coalesce(kind,'-') kind, coalesce(cls,'-') cls, coalesce(why,'deletable') why,
       count(*) n, count(distinct rid) rows_
from d where kind is not null group by 1,2,3,4 order by 1,5 desc;""",
    "by_row": """, ue as (select ux.*, (col in ('p.faq','c.faq') and answer_noninf) noninf from ux),
rowagg as (
 select col, rid, count(*) n_units, count(*) filter (where noninf) n_noninf,
   bool_or(noninf and unit_ins) noninf_ins, bool_and(noninf) all_noninf,
   coalesce(sum(n_del) filter (where not noninf), 0) del_sents, sum(n_narr) narr_sents,
   bool_or(not noninf and any_ins) s_ins, bool_or(not noninf and n_del > 0 and all_del) s_empty,
   bool_or(not noninf and n_del > 0 and bad_next) s_next, bool_or(not noninf and n_del > 0 and bad_entity) s_entity,
   bool_or(n_narr > 0) has_narr
 from ue group by 1,2)
select col, count(*) rows_, count(*) filter (where has_narr) rows_narr, sum(narr_sents) narr_sents,
 count(*) filter (where n_noninf > 0 and not all_noninf and not noninf_ins) r5_rows,
 sum(n_noninf) filter (where not all_noninf and not noninf_ins) r5_entries,
 count(*) filter (where n_noninf > 0 and all_noninf) r5_skip_empty, count(*) filter (where noninf_ins) r5_skip_ins,
 count(*) filter (where del_sents > 0) del_rows,
 count(*) filter (where del_sents > 0 and not (s_ins or s_empty or s_next or s_entity)) ok_rows,
 sum(del_sents) filter (where del_sents > 0 and not (s_ins or s_empty or s_next or s_entity)) ok_sents,
 count(*) filter (where del_sents > 0 and s_ins) skip_ins, count(*) filter (where del_sents > 0 and s_empty) skip_empty,
 count(*) filter (where del_sents > 0 and s_next) skip_next, count(*) filter (where del_sents > 0 and s_entity) skip_entity
from rowagg group by 1 order by 1;""",
}


def write_sql():
    out = os.path.join(HERE, "text-defects-measure.sql")
    with open(out, "w") as f:
        f.write("-- GENERATED by `python3 -I text_defect_rules.py sql` from the patterns in text_defect_rules.py.\n"
                "-- READ ONLY. Each statement is a separate read; run one at a time. Results are small (aggregates).\n"
                "-- The SQL side measures R2-R5 (narrator sentences, FAQ entries). R6 uses count-statements SQL in\n"
                "-- PENDING-READS.md and is decided in Python, because the categories need the hand-checked lists.\n\n")
        for name, tail in TAILS.items():
            f.write(f"-- [{name}]\n" + measure_sql(tail) + "\n\n")
    print("wrote", out)
SQL_CORE = r"""
rx as (select {SING} sing, {PLUR} plur, {LOCAL} loc, {SITE} site, {ROMAN_I} roman, {GAP} gap, {FOUNDER} founder,
  {ADVICE} advice, {GAP_NEG} gapneg, {GAP_HARD} gaphard, {ENTITY_EXEMPT_LAST} ent_exempt, {GENERIC_ADVICE} gadv, {GENERIC_GAP} ggap, {NUM_MASK} nmask, {NUMERIC} num, {URL} url,
  {CLAUSE} clause, {COMMA_SPLICE} splice, {SPLICE_OK} splice_ok, {POLARITY} polar, {LEXICON} lex, {LEX_PRICE_SCHEDULE} lexps, {INSURANCE} ins, {DANGLING_OPENER} dangle, {ABBREV} abbrev, {SPLIT} split,
  {CAPWORD} cap),
src as (
  select 'p.desc' col, p.id rid, 0 ent, p.ai_description x, p.name n1, p.city n2,
         initcap(replace(c.state_slug,'-',' ')) n3, p.ai_description ~ {INSURANCE} insx
    from pp_pools p left join pp_cities c on c.id = p.city_id where p.ai_description is not null
  union all
  select 'p.faq', p.id, o::int, e->>'a', p.name, p.city, initcap(replace(c.state_slug,'-',' ')), e::text ~ {INSURANCE}
    from pp_pools p left join pp_cities c on c.id = p.city_id, jsonb_array_elements(p.ai_faqs) with ordinality a(e,o)
   where jsonb_typeof(p.ai_faqs) = 'array'
  union all
  select 'p.tip', p.id, o::int, e, p.name, p.city, initcap(replace(c.state_slug,'-',' ')), e ~ {INSURANCE}
    from pp_pools p left join pp_cities c on c.id = p.city_id, jsonb_array_elements_text(p.ai_tips) with ordinality a(e,o)
   where jsonb_typeof(p.ai_tips) = 'array'
  union all
  select 'c.intro', c.id, 0, c.ai_intro, null, c.city_name, initcap(replace(c.state_slug,'-',' ')), c.ai_intro ~ {INSURANCE}
    from pp_cities c where c.ai_intro is not null
  union all
  select 'c.faq', c.id, o::int, e->>'a', null, c.city_name, initcap(replace(c.state_slug,'-',' ')), e::text ~ {INSURANCE}
    from pp_cities c, jsonb_array_elements(c.ai_faqs) with ordinality a(e,o) where jsonb_typeof(c.ai_faqs) = 'array'),
sp as (
  select src.col, src.rid, src.ent, src.n1, src.n2, src.n3, src.insx, t.k::int k, replace(t.z, {MARK}, '.') s
    from src, rx, regexp_split_to_table(regexp_replace(src.x, rx.abbrev, '\1' || {MARK}, 'g'), rx.split) with ordinality t(z, k)
   where t.z <> ''),
m as (
  select sp.*, regexp_replace(sp.s, rx.roman, '\1 _', 'g') ms from sp, rx),
k as (
  select m.*,
    case when ms ~ rx.sing then 'singular'
         when (ms ~ rx.plur or ms ~ rx.loc) and ms ~ rx.site then null
         when ms ~ rx.plur then 'plural' when ms ~ rx.loc then 'local' end kind,
    regexp_replace(s, rx.nmask, 'X', 'g') ~ rx.num has_num,
    s ~ rx.url has_url, (s ~ rx.clause or (s ~ rx.splice and s !~ rx.splice_ok)) has_clause, s ~ rx.polar is_polar, s ~ rx.lex has_lex, s ~ rx.lexps has_lexps, s ~ rx.ins has_ins,
    (s ~ rx.gap and s ~ rx.gapneg) is_gap, s ~ rx.gaphard is_gaphard, s ~ rx.advice is_adv, s ~ rx.founder is_founder, (s ~ rx.gadv or s ~ rx.ggap) is_generic,
    regexp_replace(replace(replace(replace(coalesce(substring(s from ' (.*)$'), ''), coalesce(n1, '\u0001'), ' '),
      coalesce(n2, '\u0001'), ' '), coalesce(n3, '\u0001'), ' '), rx.sing, ' ', 'g') ~ rx.cap has_entity,
    regexp_replace(regexp_replace(replace(replace(replace(coalesce(substring(s from ' (.*)$'), ''), coalesce(n1, '\u0001'), ' '),
      coalesce(n2, '\u0001'), ' '), coalesce(n3, '\u0001'), ' '), rx.sing, ' ', 'g'), rx.ent_exempt, ' ', 'g') ~ rx.cap has_entity_last,
    s ~ rx.dangle dangles
  from m, rx),
c as (
  select k.*,
    case when kind is null then null when has_ins then 'insurance'
         when kind = 'singular' and is_founder then 'founder' when is_gap then 'gap'
         when is_adv then 'advice' else 'opinion' end cls,
    case when kind is null then null when has_ins then 'insurance'
         when kind = 'singular' and is_founder then (case when has_lex or has_lexps then 'fact_vocabulary'
                                                          when is_polar then 'answer_polarity' end)
         when kind = 'local' and col like 'p.%' then 'local_marker_on_pool_page'
         when has_num then 'number'
         when has_url then 'url_or_contact' when has_clause then 'second_clause'
         when is_polar then 'answer_polarity'
         when not is_gap and has_lex then 'fact_vocabulary'
         when not is_gap and not is_adv and has_lexps then 'fact_vocabulary'
         when is_gap and not is_gaphard and (has_lex or has_lexps) then 'fact_vocabulary' end why
  from k),
d as (
  select c.*, (kind is not null and why is null) del,
    (kind is null and is_generic and not has_num and not has_url and not has_clause) gen_ok
  from c),
nx as (  -- for every sentence: position of the next KEPT sentence in the same unit, and its opener
  select d.*, min(case when not d.del then d.k end) over (partition by d.col, d.rid, d.ent order by d.k
           rows between 1 following and unbounded following) next_kept
  from d),
nx2 as (
  select nx.*, d2.dangles next_dangles
  from nx left join d d2 on d2.col = nx.col and d2.rid = nx.rid and d2.ent = nx.ent and d2.k = nx.next_kept),
ux as (  -- one row per field unit (a description, an intro, one FAQ answer, one tip)
  select col, rid, ent,
    count(*) n_sent, count(*) filter (where kind is not null) n_narr, count(*) filter (where del) n_del,
    bool_or(kind is not null and has_ins) any_ins, bool_or(insx) unit_ins,
    bool_and(del or gen_ok) and bool_or(kind is not null) answer_noninf,
    bool_and(del) all_del,
    coalesce(bool_or(del and next_dangles), false) bad_next,
    coalesce(bool_or(del and ((has_entity and next_kept is not null) or (has_entity_last and next_kept is null))), false) bad_entity
  from nx2 group by 1,2,3)
"""


def measure_sql(tail):
    lit = {k: pg(v) for k, v in globals().items() if isinstance(v, str) and k.isupper() and k != "SQL_CORE"}
    lit["MARK"] = pg(ABBREV_MARK)
    core = SQL_CORE
    for k2, v in lit.items():
        core = core.replace("{" + k2 + "}", v)
    return "set transaction read only;\nwith " + core.strip() + "\n" + tail



if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "test"
    if cmd == "rules":
        with open(os.path.join(PARENT, "rules.json"), "w") as f:
            json.dump(rules(), f, indent=2, ensure_ascii=False)
            f.write("\n")
        print("wrote", os.path.join(PARENT, "rules.json"))
    elif cmd == "test":
        sys.exit(0 if run_tests(sys.argv[2] if len(sys.argv) > 2 else None) else 1)
    elif cmd == "sql":
        write_sql()
    elif cmd == "sqlcore":
        print(measure_sql(open(sys.argv[2]).read() if len(sys.argv) > 2 else "select 1;"))
    elif cmd == "live":
        # live OUTDIR LIVE1.jsonl [LIVE2.jsonl ...]
        print(json.dumps(live(sys.argv[3:], sys.argv[2]), indent=1, sort_keys=True))
    elif cmd == "pg":
        for k in ("SING", "PLUR", "LOCAL", "SITE", "ROMAN_I", "GAP", "ADVICE", "GENERIC_ADVICE", "GENERIC_GAP",
                  "NUM_MASK", "NUMERIC", "URL", "CLAUSE", "LEXICON", "INSURANCE", "DANGLING_OPENER", "ABBREV",
                  "SPLIT", "COUNT", "COUNT_VAGUE"):
            print(k, "=", pg(globals()[k]))
