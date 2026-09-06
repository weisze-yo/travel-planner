# -*- coding: utf-8 -*-
"""
Validate a research batch before handing it to the import session.

    python3 validate_research.py day3-ginzan.json [more.json ...]

Checks the output contract in RESEARCH_BRIEF.md §4. Exits 1 on any error.
Warnings do not fail the run but should be read.

v2 — 4 Sep 2026, after the tour agent revised the itinerary:
  * 4 of 7 hotels changed. The superseded hotel names stay VALID as anchorStops so the
    research done against them still validates, but a batch carrying such a record must
    declare it in a `removedFromDay` manifest (see ITINERARY_CHANGE.md).
  * `Ginza` is a MAIN Day 7 stop (owner decision A6, 4 Sep 2026) alongside Shisui Premium
    Outlets. The owner removes one later by editing the plan. It is NOT a backup stop.
  * Walking legs are capped at 30 minutes — the exploration radius the user asked for.
"""
import sys, json, io, re

# --- the 30 stops CURRENTLY on the itinerary (4 Sep screenshots + owner decision A6) ---
ACTIVE = {
 "Haneda Airport — Terminal 3","Hotel Metropolitan Tokyo Haneda","Tokyo Station","Sendai Station",
 "Ginza",   # MAIN Day 7 stop per owner decision A6 — alternative to Shisui, owner edits the plan
 "Matsushima Fish Market","Zuiganji Temple","Godaido Hall","Matsushima Bay Cruise — Nioumaru course",
 "Ooedo Onsen Monogatari Naruko Onsen Kounkaku","Ginzan Onsen Street","Zao Fox Village",
 "Mercure Miyagi Zao Resort & Spa","Goshikinuma Ponds","Tsuruga Castle (Tsurugajo)","Ouchi-juku",
 "Kinugawa Onsen Hana no Yado Matsuya","Kegon Falls","Nikko Toshogu Shrine",
 "Edo Wonderland Nikko Edomura","Hotel Nikko Tsukuba","Hitachi Seaside Park",
 "Kawagoe Old Town (Kurazukuri Street)","Shibuya Scramble Crossing","Shinjuku Granbell Hotel",
 "Tokyo Tower","Tsukiji Outer Market","Shisui Premium Outlets","International Resort Hotel Yurakujo",
 "Narita Airport — Terminal 1 South Wing",
}
# --- kept for shape compatibility; empty since owner decision A6 made Ginza a MAIN stop ---
BACKUP = set()
# --- stops SUPERSEDED on 4 Sep. Records against them stay valid but must be declared --
RETIRED = {
 "Hotel Metropolitan Haneda":                           "renamed to Hotel Metropolitan Tokyo Haneda",
 "Hotel Kameya, Naruko Onsen":                          "replaced by Ooedo Onsen Monogatari Naruko Onsen Kounkaku",
 "Okuiizaka Anabara Onsen Yoshikawaya":                 "replaced by Mercure Miyagi Zao Resort & Spa",
 "Ooedo Onsen Monogatari Premium Kinugawa Kanko Hotel": "replaced by Kinugawa Onsen Hana no Yado Matsuya",
}
STOPS    = ACTIVE | BACKUP | set(RETIRED)
CATEGORY = {"food","cosme","cloth","shopping","sight","rest"}
MODE     = {"walk","train","bus"}
WINDOW   = {"day","night","dawn","24h"}
CONF     = {"high","medium","low"}
PREC     = {"verified","approximate"}
LICENCE  = {"CC0","CC BY","CC BY-SA","public domain","official-permitted","own"}
DAYS     = {"mon","tue","wed","thu","fri","sat","sun"}
HHMM     = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
MAX_WALK = 30          # minutes, per leg — the agreed exploration radius

errs, warns = [], []
def E(m): errs.append(m)
def W(m): warns.append(m)

def in_japan(lat, lon):
    return isinstance(lat,(int,float)) and isinstance(lon,(int,float)) \
           and 30 < lat < 46 and 128 < lon < 146

def check_images(r, where):
    """Images get redistributed into the user's app, so licence is mandatory."""
    imgs = r.get("images")
    if imgs is None: return
    if not isinstance(imgs, list):
        E("%s: images must be a list" % where); return
    for k, im in enumerate(imgs):
        w = "%s images[%d]" % (where, k)
        if not isinstance(im, dict): E("%s: not an object" % w); continue
        if not str(im.get("url","")).startswith("http"):
            E("%s: no usable url" % w)
        lic = im.get("license")
        if lic not in LICENCE:
            E("%s: license must be one of %s (got %r) — no unlicensed scraping"
              % (w, sorted(LICENCE), lic))
        if lic in {"CC BY","CC BY-SA"} and not im.get("credit"):
            E("%s: %s requires a credit line" % (w, lic))
        if not im.get("sourcePage"):
            E("%s: no sourcePage — the page the licence is stated on" % w)

def check_common(r, where, declared):
    if not r.get("name"): E("%s: no name" % where)
    a = r.get("anchorStop")
    if a and a not in STOPS:
        E("%s: anchorStop %r is not a known stop" % (where, a))
    elif a in RETIRED and a not in declared:
        E("%s: anchorStop %r was SUPERSEDED on 4 Sep (%s) — declare it in this batch's "
          "'removedFromDay' manifest so the import files it under \"Removed from this Day\""
          % (where, a, RETIRED[a]))
    c = r.get("confidence")
    if c not in CONF:
        E("%s: confidence must be one of %s (got %r)" % (where, sorted(CONF), c))
    elif c != "high" and not r.get("confidenceNote"):
        E("%s: confidence %r with no confidenceNote" % (where, c))
    if not r.get("source"):
        W("%s: no source URL" % where)
    lat, lon = r.get("latitude"), r.get("longitude")
    if lat is not None or lon is not None:
        if not in_japan(lat, lon):
            E("%s: coordinates %r,%r are not in Japan" % (where, lat, lon))
        p = r.get("coordPrecision")
        if p not in PREC:
            E("%s: coordPrecision must be 'verified' or 'approximate' (got %r)" % (where, p))

def check_hours(h, where):
    if not isinstance(h, dict): E("%s: hours must be an object" % where); return
    for k, v in h.items():
        if k not in DAYS: E("%s: hours key %r is not a weekday" % (where, k)); continue
        if v is None: continue          # closed that day — valid
        if not isinstance(v, list):
            E("%s: hours.%s must be null or a list of [open,close]" % (where, k)); continue
        for span in v:
            if (not isinstance(span, list) or len(span) != 2
                    or not all(isinstance(t,str) and HHMM.match(t) for t in span)):
                E("%s: hours.%s bad span %r — want [\"09:00\",\"17:00\"]" % (where, k, span))

def validate(path):
    try:
        doc = json.load(io.open(path, encoding="utf-8"))
    except Exception as e:
        E("%s: not valid JSON — %s" % (path, e)); return
    tag = doc.get("batch") or path
    if not doc.get("batch"): W("%s: no 'batch' name" % path)

    # --- the removedFromDay manifest -------------------------------------------------
    rem = doc.get("removedFromDay", {})
    if not isinstance(rem, dict):
        E("%s: removedFromDay must be an object keyed by the superseded stop name" % tag)
        rem = {}
    for stop, blk in rem.items():
        w = "%s removedFromDay[%r]" % (tag, stop)
        if stop not in RETIRED:
            E("%s: %r is not a superseded stop — only these are: %s" % (w, stop, sorted(RETIRED)))
        if not isinstance(blk, dict):
            E("%s: must be an object" % w); continue
        if not blk.get("reason"):     E("%s: no reason" % w)
        if not blk.get("replacedBy"): E("%s: no replacedBy" % w)
    declared = set(rem)

    for i, r in enumerate(doc.get("places", [])):
        w = "%s places[%d] %r" % (tag, i, r.get("name","?"))
        check_common(r, w, declared); check_images(r, w)
        if r.get("category") not in CATEGORY:
            E("%s: category must be one of %s (got %r)" % (w, sorted(CATEGORY), r.get("category")))
        if r.get("timeWindow") not in WINDOW:
            E("%s: timeWindow must be one of %s (got %r)" % (w, sorted(WINDOW), r.get("timeWindow")))
        sm = r.get("stayMinutes")
        if not isinstance(sm, int) or not (0 < sm <= 600):
            E("%s: stayMinutes must be 1–600 (got %r)" % (w, sm))
        legs = r.get("legs")
        if not isinstance(legs, list) or not legs:
            E("%s: legs[] required — how do you get there from the anchor stop?" % w)
        else:
            for lg in legs:
                if not isinstance(lg, dict) or lg.get("mode") not in MODE \
                        or not isinstance(lg.get("minutes"), int):
                    E("%s: bad leg %r — want {mode:walk|train|bus, minutes:N}" % (w, lg))
                elif lg["mode"] == "walk" and lg["minutes"] > MAX_WALK:
                    # a retired record documents what WAS researched — do not rewrite its legs
                    (W if r.get("retired") else E)(
                        "%s: walk leg is %d min, over the %d-min radius%s"
                        % (w, lg["minutes"], MAX_WALK,
                           " (retired record — left as researched)" if r.get("retired")
                           else ". Either drop the place or reach it by train/bus."))
            tot = sum(l.get("minutes",0) for l in legs if isinstance(l, dict))
            if tot > 45: W("%s: %d min door to door — a long way inside the stop time" % (w, tot))
        if not r.get("note"): E("%s: no note" % w)
        elif len(r["note"]) > 400: W("%s: note is long (%d chars)" % (w, len(r["note"])))

    for i, r in enumerate(doc.get("mustSee", [])):
        w = "%s mustSee[%d] %r" % (tag, i, r.get("title") or r.get("name","?"))
        if not r.get("title"): E("%s: no title" % w)
        if not r.get("whereToFind"): E("%s: no whereToFind — the literal standing position" % w)
        if not r.get("summary"): E("%s: no summary" % w)
        check_common(dict(r, name=r.get("title","x")), w, declared); check_images(r, w)

    for i, r in enumerate(doc.get("shopping", [])):
        w = "%s shopping[%d] %r" % (tag, i, r.get("name","?"))
        check_common(r, w, declared); check_images(r, w)
        est = r.get("estimate")
        if est is not None and not isinstance(est,(int,float)):
            E("%s: estimate must be a number in yen or null" % w)
        if not r.get("placeLabel"): E("%s: no placeLabel (which shop / which stop)" % w)

    ess = doc.get("essentials", {})
    if not isinstance(ess, dict): E("%s: essentials must be an object keyed by stop name" % tag)
    else:
        for stop, blk in ess.items():
            w = "%s essentials[%r]" % (tag, stop)
            if stop not in STOPS: E("%s: not a known stop" % w)
            elif stop in RETIRED and stop not in declared:
                E("%s: superseded stop not declared in removedFromDay" % w)
            if "hours" in blk: check_hours(blk["hours"], w)
            if not blk.get("closedNote") and blk.get("hours") is None:
                W("%s: neither hours nor closedNote" % w)

    for i, r in enumerate(doc.get("subRoutes", [])):
        w = "%s subRoutes[%d]" % (tag, i)
        if r.get("anchorStop") not in STOPS: E("%s: anchorStop not a known stop" % w)
        for k in ("startMinutes","deadlineMinutes"):
            if not isinstance(r.get(k), int): E("%s: %s must be minutes past midnight" % (w,k))
        if isinstance(r.get("startMinutes"),int) and isinstance(r.get("deadlineMinutes"),int) \
                and r["deadlineMinutes"] <= r["startMinutes"]:
            E("%s: deadline is not after the start" % w)
        if not r.get("placeIDs"): E("%s: no placeIDs in the loop" % w)

    for stop, blk in doc.get("outfitByStop", {}).items():
        w = "%s outfitByStop[%r]" % (tag, stop)
        if stop not in STOPS: E("%s: not a known stop" % w)
        elif stop in RETIRED and stop not in declared:
            E("%s: superseded stop not declared in removedFromDay" % w)
        if not blk.get("photo"):     E("%s: no 'photo' advice" % w)
        if not blk.get("practical"): E("%s: no 'practical' advice" % w)

    counts = {k: len(doc.get(k, [])) for k in
              ("places","mustSee","shopping","subRoutes")}
    counts["essentials"]   = len(doc.get("essentials", {}))
    counts["outfitByStop"] = len(doc.get("outfitByStop", {}))
    counts["retiredStops"] = len(rem)
    print("  %-22s %s" % (tag, " ".join("%s=%d" % kv for kv in counts.items() if kv[1])))

if len(sys.argv) < 2:
    print(__doc__); sys.exit(2)
print("validating %d file(s)" % (len(sys.argv)-1))
for p in sys.argv[1:]:
    validate(p)
print()
for m in warns: print("WARN  " + m)
for m in errs:  print("ERROR " + m)
print("\n%d error(s), %d warning(s)" % (len(errs), len(warns)))
sys.exit(1 if errs else 0)
