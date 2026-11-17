#!/usr/bin/env python3
"""Reference cleaner for the public-pools text repair (Python twin of the SQL in cleaner/core.sql).

It is the oracle the local test compares the SQL against, row by row and byte by byte.

* The rules themselves are NOT redefined here: every pattern and every per-sentence decision comes from
  ../text-defects/text_defect_rules.py (the single source of truth behind rules.json), loaded by path.
* This file adds only the field-level skip conditions that the apply step needs on top of rules.json
  ("ADDENDUM", documented in RUNBOOK.md section 3 and asserted by the test). Each one can only make the
  cleaner change LESS:
    A1 below_min_length  a sentence pass whose result is shorter than MIN_PROSE_CHARS (description, intro)
                         or, for a FAQ answer it changes, MIN_ANSWER_CHARS, is skipped.
    A2 paragraph_break   a sentence pass that would delete a sentence next to a line break is skipped
                         (deleting it would merge two paragraphs).
    A3 insurance_anywhere a field (or a FAQ array) in which ANY sentence, question or answer mentions
                         insurance / liability / coverage / claims / damage is never touched by a sentence
                         pass (rules.json only froze fields whose NARRATOR sentences mention it).
    A4 contains_mark     a field containing the protection character U+00A7 (measured absent on 2026-11-15)
                         is never touched by a sentence pass (the splitter uses it internally).
    A5 next_sentence_refers_back_a5  the sentence that would follow a deleted one opens with a back-reference
                         the rules.json opener list misses ("Three of those, ...", "Some of these, ...", "Of the
                         five, ...", "All four ..."): the pass is skipped. Found in the before/after review of
                         2026-11-16 (Chicago and Lakewood FAQ answers after an R6 deletion).
  A freeze ("ALL") is REPORTED only where a sentence rule would otherwise have deleted something.
  With addendum=False the functions reproduce text_defect_rules.plan_field / plan_faqs exactly
  (the test checks that too, on every live field).

It opens no network or database connection and writes nothing.
"""
import importlib.util
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
_RULES = os.path.join(os.path.dirname(HERE), "text-defects", "text_defect_rules.py")
_spec = importlib.util.spec_from_file_location("text_defect_rules", _RULES)
T = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(T)

MIN_PROSE_CHARS = 120   # ai_description, ai_intro after a pass
# A5: back-reference in the first words of the sentence that would follow a deleted one (same regex subset as
# rules.json: works identically in Python re and PostgreSQL ARE).
A5_BACKREF = (r"(?i)^(([a-z0-9'’-]+ ){0,3}(these|those)(?![a-z'’])|([a-z0-9'’-]+ ){0,2}of (them|these|those)(?![a-z'’])"
              r"|of the (two|three|four|five|six|seven|eight|nine|ten|[0-9]+)(?![a-z])"
              r"|(all|both|each|the other|the remaining|only) (two|three|four|five|six|seven|eight|nine|ten|[0-9]+)"
              r"(?![a-z]))")
MIN_ANSWER_CHARS = 40   # a FAQ answer that a pass changes

FIELD_MIN = {"desc": MIN_PROSE_CHARS, "intro": MIN_PROSE_CHARS, "answer": MIN_ANSWER_CHARS}
# The joined-clause freeze of the rules (text_defect_rules.column_joined_keep, 2026-11-17) is set only when the
# rules would change the column, so unlike the freezes below it is always reported.
JOINED = "joined_clause_kept"


def split_with_seps(text):
    """Sentences (abbreviation marks restored) and the separators between them, exactly as rebuild() sees them."""
    protected = re.sub(T.ABBREV, lambda m: m.group(1) + T.ABBREV_MARK, text)
    pieces = re.split("(" + T.SPLIT + ")", protected)
    return [p.replace(T.ABBREV_MARK, ".") for p in pieces[0::2]], pieces[1::2]


def would_touch(text, pool_page, actual=None, distinct=None):
    """True if R6 (cities) or the narrator rule would mark at least one sentence of this text."""
    for s in T.split_sentences(text):
        kind, cls, ok, why = T.classify(s, pool_page)
        if kind is not None and ok:
            return True
        if actual is not None and T.r6_classify(s, actual, distinct)[0] == "auto":
            return True
    return False


def _marks(sents, names, pool_page, rule, actual, distinct):
    out = []
    for s in sents:
        if rule == "R6":
            out.append(T.r6_classify(s, actual, distinct)[0] == "auto")
        else:
            kind, cls, ok, why = T.classify(s, pool_page)
            out.append(kind is not None and ok)
    return out


def one_pass(text, names, pool_page, rule, actual=None, distinct=None, field="desc", addendum=True):
    """Same contract as text_defect_rules._pass: (new_text, [(rule, sentence)], skip_reason)."""
    sents = T.split_sentences(text)
    marks = _marks(sents, names, pool_page, rule, actual, distinct)
    dels = [(rule, s) for m, s in zip(marks, sents) if m]
    if not dels:
        return text, [], None
    if all(marks):
        return text, dels, "field_would_be_empty"
    for i, (s, d) in enumerate(zip(sents, marks)):
        if not d:
            continue
        nxt = next((sents[j] for j in range(i + 1, len(sents)) if not marks[j]), None)
        if nxt is not None and re.search(T.DANGLING_OPENER, nxt):
            return text, dels, "next_sentence_refers_back"
        if addendum and nxt is not None and re.search(A5_BACKREF, nxt):
            return text, dels, "next_sentence_refers_back_a5"
        if T.has_entity(s, names, last=nxt is None):   # the last sentence too (rules revision 2026-11-16)
            return text, dels, "deleted_sentence_names_an_entity"
    new = T.rebuild(text, sents, marks)
    if addendum:
        _, seps = split_with_seps(text)
        for i, d in enumerate(marks):
            if d and ((i > 0 and "\n" in seps[i - 1]) or (i < len(seps) and "\n" in seps[i])):
                return text, dels, "paragraph_break"
        if len(new) < FIELD_MIN[field]:
            return text, dels, "below_min_length"
    return new, dels, None


def plan_field(text, names, pool_page=False, actual=None, distinct=None, narr_rule=None, addendum=True):
    """Same contract as text_defect_rules.plan_field (plus the addendum skips)."""
    narr_rule = narr_rule or ("R2" if pool_page else "R4")
    field = "desc" if pool_page else "intro"
    res = {"after": None, "deleted": [], "skips": {}}
    if T.field_has_insurance(text, pool_page, actual, distinct):
        res["skips"]["ALL"] = "insurance"
        return res
    if addendum and re.search(T.INSURANCE, text):
        res["skips"]["ALL"] = "insurance_anywhere"
        return res
    if addendum and T.ABBREV_MARK in text:
        res["skips"]["ALL"] = "contains_mark"
        return res
    cur = text
    for rule in (["R6"] if actual is not None else []) + [narr_rule]:
        new, dels, why = one_pass(cur, names, pool_page, rule, actual, distinct, field, addendum)
        if why:
            res["skips"][rule] = why
        elif dels:
            cur = new
            res["deleted"] += dels
    if res["deleted"] and T.column_joined_keep([text], pool_page, actual, distinct):   # rules 2026-11-17
        return {"after": None, "deleted": [], "skips": {"ALL": "joined_clause_kept"}}
    if res["deleted"]:
        res["after"] = cur
    return res


def plan_faqs(faqs, names, pool_page=False, actual=None, distinct=None, addendum=True):
    """Same contract as text_defect_rules.plan_faqs (plus the addendum skips): (new_list or None, report)."""
    rep = {"r5_deleted": [], "r5_skip": None, "sent_deleted": [], "skips": {}, "would_touch": False}
    if not isinstance(faqs, list) or not faqs:
        return None, rep
    keep = []
    for e in faqs:
        if not T._plain_entry(e):
            keep.append(e)
            continue
        if T.answer_is_noninformative(e["a"], pool_page):
            q = e.get("q")
            if re.search(T.INSURANCE, e["a"]) or (isinstance(q, str) and re.search(T.INSURANCE, q)):
                rep["r5_skip"] = "insurance"
                keep.append(e)
            else:
                rep["r5_deleted"].append(e)
            continue
        keep.append(e)
    if rep["r5_deleted"] and not any(T._plain_entry(e) for e in keep):
        rep["r5_skip"], rep["r5_deleted"], keep = "array_would_be_empty", [], list(faqs)
    cur = [dict(e) if isinstance(e, dict) else e for e in keep]
    plain = [e for e in cur if T._plain_entry(e)]
    rep["would_touch"] = any(would_touch(e["a"], pool_page, actual, distinct) for e in plain)
    if any(T.field_has_insurance(e["a"], pool_page, actual, distinct) for e in plain):
        rep["skips"]["ALL"] = "insurance"
    elif addendum and any(re.search(T.INSURANCE, e["a"]) or (isinstance(e.get("q"), str) and
                                                             re.search(T.INSURANCE, e["q"])) for e in plain):
        rep["skips"]["ALL"] = "insurance_anywhere"
    elif addendum and any(T.ABBREV_MARK in e["a"] for e in plain):
        rep["skips"]["ALL"] = "contains_mark"
    else:
        narr = "R3" if pool_page else "R4"
        for rule in (["R6"] if actual is not None else []) + [narr]:
            results = [(one_pass(e["a"], names, pool_page, rule, actual, distinct, "answer", addendum)
                        if T._plain_entry(e) else None) for e in cur]
            why = next((r[2] for r in results if r and r[2]), None)
            if why:
                rep["skips"][rule] = why
                continue
            for e, r in zip(cur, results):
                if r and r[1]:
                    e["a"] = r[0]
                    rep["sent_deleted"] += r[1]
    changed = bool(rep["r5_deleted"]) or bool(rep["sent_deleted"])
    if changed and T.column_joined_keep([e["a"] for e in faqs if T._plain_entry(e)], pool_page, actual, distinct):
        rep.update(r5_deleted=[], r5_skip=None, sent_deleted=[], skips={"ALL": "joined_clause_kept"})
        return None, rep
    return (cur if changed else None), rep


def best_for(raw):
    """R1 exactly as rules.json: (new_or_None, skip_reason_or_None)."""
    if raw is None:
        return None, "null"
    new, why = T.best_for_reformat(raw)
    return (None, why) if why else (new, None)


def state_name(state_slug):
    """Same as the SQL initcap(replace(state_slug, '-', ' ')) for ASCII slugs."""
    return " ".join(w[:1].upper() + w[1:].lower() for w in (state_slug or "").replace("-", " ").split(" ")) \
        if state_slug is not None else None


def plan_pool(row, addendum=True):
    """row: dict with name, city, state_slug, ai_best_for, ai_description, ai_faqs (list or None).
    Returns {column: {"new": value_or_None, "rules": [...], "skips": {...}}} for every column considered."""
    names = [row.get("name"), row.get("city"), state_name(row.get("state_slug"))]
    out = {}
    new, why = best_for(row.get("ai_best_for"))
    out["ai_best_for"] = {"new": new, "rules": ["R1"] if new is not None else [],
                          "skips": {"R1": why} if why and why != "null" else {}}
    d = row.get("ai_description")
    if d is not None:
        p = plan_field(d, names, True, addendum=addendum)
        if p["skips"].get("ALL", JOINED) != JOINED and not would_touch(d, True):
            del p["skips"]["ALL"]
        out["ai_description"] = {"new": p["after"], "rules": sorted({r for r, _ in p["deleted"]}),
                                 "skips": p["skips"]}
    f = row.get("ai_faqs")
    if isinstance(f, list):
        new, rep = plan_faqs(f, names, True, addendum=addendum)
        if rep["skips"].get("ALL", JOINED) != JOINED and not rep["would_touch"]:
            del rep["skips"]["ALL"]
        rules = (["R5"] if rep["r5_deleted"] else []) + sorted({r for r, _ in rep["sent_deleted"]})
        sk = dict(rep["skips"])
        if rep["r5_skip"]:
            sk["R5"] = rep["r5_skip"]
        out["ai_faqs"] = {"new": new, "rules": rules, "skips": sk}
    return out


def plan_city(row, actual, distinct=None, addendum=True):
    names = [None, row.get("city_name"), state_name(row.get("state_slug"))]
    out = {}
    t = row.get("ai_intro")
    if t is not None:
        p = plan_field(t, names, False, actual, distinct, addendum=addendum)
        if p["skips"].get("ALL", JOINED) != JOINED and not would_touch(t, False, actual, distinct):
            del p["skips"]["ALL"]
        out["ai_intro"] = {"new": p["after"], "rules": sorted({r for r, _ in p["deleted"]}, key="R6R4".index),
                           "skips": p["skips"]}
    f = row.get("ai_faqs")
    if isinstance(f, list):
        new, rep = plan_faqs(f, names, False, actual, distinct, addendum=addendum)
        if rep["skips"].get("ALL", JOINED) != JOINED and not rep["would_touch"]:
            del rep["skips"]["ALL"]
        rules = (["R5"] if rep["r5_deleted"] else []) + sorted({r for r, _ in rep["sent_deleted"]},
                                                               key="R6R4".index)
        sk = dict(rep["skips"])
        if rep["r5_skip"]:
            sk["R5"] = rep["r5_skip"]
        out["ai_faqs"] = {"new": new, "rules": rules, "skips": sk}
    return out
