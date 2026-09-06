# -*- coding: utf-8 -*-
"""
fetch_images.py — collect licensed images for the 29 Trip 12 stops from Wikimedia Commons.

RUN THIS IN SESSION B, on your own machine. It could not run in the research sandbox:
commons.wikimedia.org and api.wikimedia.org are cache-only there and Openverse 403s.
From a normal network it is a 10-minute job.

    python3 fetch_images.py                 # dry run, writes images_patch.json
    python3 fetch_images.py --apply         # also merges into the day*.json batches
    python3 fetch_images.py --stop "Ouchi-juku"   # one stop only

Then:  python3 validate_research.py day*.json     # must still exit 0

Requires only the standard library.
"""
import json, io, os, re, sys, time, glob, argparse
import urllib.request, urllib.parse, urllib.error

API = "https://commons.wikimedia.org/w/api.php"

# Wikimedia REQUIRES a descriptive User-Agent and returns 403 without one.
# Put a real contact address here before running — it is their policy, not a formality.
UA = "ViTroxTrip12-ImageCollector/1.0 (https://vitrox.com; lead-ming.seng@vitrox.com)"

# The validator's allowed set. Anything not mapped here is REJECTED, not guessed.
LICENCE_MAP = [
    (re.compile(r'^cc0|^cc[- ]zero',                re.I), "CC0"),
    (re.compile(r'^pd|public[- ]domain',            re.I), "public domain"),
    (re.compile(r'^cc[- ]by[- ]sa',                 re.I), "CC BY-SA"),
    (re.compile(r'^cc[- ]by(?![- ]sa)',             re.I), "CC BY"),
]
# Licences Commons hosts that we must NOT redistribute into the user's Firebase Storage.
REJECT = re.compile(r'non[- ]free|fair[- ]use|nc\b|noncommercial|nd\b|noderiv|gfdl[- ]only', re.I)

# One search phrase per stop. Japanese first — Commons is better populated under
# Japanese names for these places, and it avoids the English-homonym problem.
QUERIES = {
 "Haneda Airport — Terminal 3":                        "羽田空港 第3ターミナル",
 "Hotel Metropolitan Haneda":                          "羽田イノベーションシティ",
 "Tokyo Station":                                      "東京駅 丸の内",
 "Sendai Station":                                     "仙台駅",
 "Matsushima Fish Market":                             "松島さかな市場",
 "Zuiganji Temple":                                    "瑞巌寺",
 "Godaido Hall":                                       "五大堂 松島",
 "Matsushima Bay Cruise — Nioumaru course":            "松島湾 遊覧船",
 "Hotel Kameya, Naruko Onsen":                         "鳴子温泉",
 "Ginzan Onsen Street":                                "銀山温泉",
 "Zao Fox Village":                                    "宮城蔵王キツネ村",
 "Okuiizaka Anabara Onsen Yoshikawaya":                "飯坂温泉",
 "Goshikinuma Ponds":                                  "五色沼 福島",
 "Tsuruga Castle (Tsurugajo)":                         "鶴ヶ城 会津若松",
 "Ouchi-juku":                                         "大内宿",
 "Ooedo Onsen Monogatari Premium Kinugawa Kanko Hotel":"鬼怒川温泉",
 "Kegon Falls":                                        "華厳滝",
 "Nikko Toshogu Shrine":                               "日光東照宮 陽明門",
 "Edo Wonderland Nikko Edomura":                       "日光江戸村",
 "Hotel Nikko Tsukuba":                                "つくば市 中心",
 "Hitachi Seaside Park":                               "国営ひたち海浜公園 コキア",
 "Kawagoe Old Town (Kurazukuri Street)":               "川越 蔵造りの町並み 時の鐘",
 "Shibuya Scramble Crossing":                          "渋谷スクランブル交差点",
 "Shinjuku Granbell Hotel":                            "新宿 歌舞伎町",
 "Tokyo Tower":                                        "東京タワー 増上寺",
 "Tsukiji Outer Market":                               "築地場外市場",
 "Shisui Premium Outlets":                             "酒々井プレミアム・アウトレット",
 "International Resort Hotel Yurakujo":                "富里市",
 "Narita Airport — Terminal 1 South Wing":             "成田国際空港 第1旅客ターミナル",
}
PER_STOP = 2          # one or two per stop, per RESEARCH_BRIEF §3g
MIN_WIDTH = 1000      # anything smaller is not worth a Storage upload
SLEEP = 0.4           # be polite; Commons is a donated service


def api(params):
    params = dict(params, format="json", formatversion=2)
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in (1, 2, 3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 403:
                sys.exit("403 from Commons — set a real contact address in UA at the top of this file.")
            if attempt == 3: raise
        except Exception:
            if attempt == 3: raise
        time.sleep(2 * attempt)


def classify(ext):
    """Map Commons licence metadata onto the validator's allowed set, or None to reject."""
    raw = " ".join(str((ext.get(k) or {}).get("value", "")) for k in
                   ("License", "LicenseShortName", "UsageTerms"))
    if not raw.strip() or REJECT.search(raw):
        return None
    for rx, name in LICENCE_MAP:
        if rx.search(raw.strip()):
            return name
    return None


def strip_html(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


def images_for(stop, query):
    """Return up to PER_STOP fully-licensed image records for one stop."""
    data = api({"action": "query", "generator": "search", "gsrsearch": query,
                "gsrnamespace": 6, "gsrlimit": 12,
                "prop": "imageinfo", "iiprop": "url|extmetadata|size|mime",
                "iiurlwidth": 1600})
    out = []
    for page in (data.get("query", {}) or {}).get("pages", []) or []:
        info = (page.get("imageinfo") or [None])[0]
        if not info: continue
        if not str(info.get("mime", "")).startswith("image/"): continue
        if (info.get("width") or 0) < MIN_WIDTH: continue
        ext = info.get("extmetadata") or {}
        lic = classify(ext)
        if not lic:
            continue                                  # no provable licence -> skip, never guess
        credit = strip_html((ext.get("Artist") or {}).get("value")) \
              or strip_html((ext.get("Credit") or {}).get("value"))
        if lic in ("CC BY", "CC BY-SA") and not credit:
            continue                                  # validator requires a credit for these
        rec = {
            "url": info.get("thumburl") or info.get("url"),   # 1600px render, not the 8 MB original
            "license": lic,
            "sourcePage": info.get("descriptionurl") or ("https://commons.wikimedia.org/wiki/" +
                          urllib.parse.quote(page.get("title", ""))),
            "caption": strip_html((ext.get("ImageDescription") or {}).get("value"))[:180]
                       or page.get("title", "").replace("File:", ""),
        }
        if credit: rec["credit"] = credit[:120]
        out.append(rec)
        if len(out) >= PER_STOP: break
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="merge into the day*.json batches")
    ap.add_argument("--stop", help="only this stop name")
    a = ap.parse_args()

    patch, misses = {}, []
    todo = {a.stop: QUERIES[a.stop]} if a.stop else QUERIES
    for stop, q in todo.items():
        try:
            imgs = images_for(stop, q)
        except Exception as e:
            print("  !! %-52s FAILED %s" % (stop[:52], e)); misses.append(stop); continue
        if imgs:
            patch[stop] = imgs
            print("  ok %-52s %d image(s): %s" % (stop[:52], len(imgs),
                  ", ".join(i["license"] for i in imgs)))
        else:
            misses.append(stop)
            print("  -- %-52s none with a provable licence" % stop[:52])
        time.sleep(SLEEP)

    json.dump(patch, io.open("images_patch.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\n%d/%d stops have licensed images -> images_patch.json" % (len(patch), len(todo)))
    if misses:
        print("no licensable image (use the image-search fallback): %s" % ", ".join(misses))

    if not a.apply:
        print("\nDry run. Re-run with --apply to merge into the batches."); return

    # Attach each stop's images to that stop's FIRST mustSee record, else its first place.
    touched = 0
    for path in sorted(glob.glob("day*-*.json")):
        doc = json.load(io.open(path, encoding="utf-8"))
        changed = False
        for stop, imgs in patch.items():
            target = next((r for r in doc.get("mustSee", []) if r.get("anchorStop") == stop), None) \
                  or next((r for r in doc.get("places", [])  if r.get("anchorStop") == stop), None)
            if target is not None and not target.get("images"):
                target["images"] = imgs; changed = True; touched += 1
        if changed:
            io.open(path, "w", encoding="utf-8").write(
                json.dumps(doc, ensure_ascii=False, indent=1))
            print("  patched %s" % path)
    print("\nattached images to %d records." % touched)
    print("NOW RUN:  python3 validate_research.py day*.json     # must exit 0")


if __name__ == "__main__":
    main()
