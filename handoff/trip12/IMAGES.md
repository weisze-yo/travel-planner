# How Session B gets the images

**The short answer: Session B doesn't have this sandbox's problem.**

Session A ran in an Anthropic cloud sandbox with a restricted egress allowlist. Every route to a
provable image licence is closed there:

| Host | What happens | Fixable by permission? |
|---|---|---|
| `commons.wikimedia.org` | "This domain is cache-only and cannot be fetched" | **No** |
| `api.wikimedia.org` | cache-only | **No** |
| `en.wikipedia.org/w/api.php` | cache-only (article pages work, the API does not) | **No** |
| `api.openverse.org` | HTTP 403 | No |
| `openverse.org` | HTTP 403 | No |

Session B runs in **Claude Code on your own machine**, on your own network. None of that applies —
`commons.wikimedia.org` is an ordinary public API from there. So the image pass isn't a research
problem to re-solve, it's a ten-minute script run.

---

## Run this

`fetch_images.py` is in this bundle. It needs only the standard library.

```sh
# 1. put a real contact address in the UA constant at the top of the file.
#    Wikimedia's policy requires a descriptive User-Agent and returns 403 without one.

python3 fetch_images.py                  # dry run -> images_patch.json, prints per-stop results
python3 fetch_images.py --apply          # merges the images into the day*.json batches
python3 validate_research.py day*.json   # must still exit 0
```

It queries Commons once per stop (Japanese search terms — Commons is better populated under
Japanese names for these places, and it dodges the English-homonym trap that sent this session's
geocoder to Hokkaido), then for each candidate reads `extmetadata` and keeps only images whose
licence maps onto the validator's allowed set:

- `cc0` / `cc-zero` → **CC0**
- `pd` / `public domain` → **public domain**
- `cc-by-sa-*` → **CC BY-SA** (requires a credit line, enforced)
- `cc-by-*` → **CC BY** (requires a credit line, enforced)
- anything matching non-free / fair-use / NC / ND / GFDL-only → **rejected**
- anything it cannot map → **rejected**

It never guesses a licence. A stop with no provable image simply gets none, and the app falls back
to the image-search link, exactly as `ViTrox_Trip12_Japan_Tohoku_Map.html` already does.

Two details that matter for the Storage upload in step 4 of your deploy brief:

- It records `iiurlwidth=1600`, so `url` is Commons' 1600 px render, not an 8 MB original. That
  keeps you under the 20 MB cap in `firebase/storage.rules` without a resize step, though you
  should still set the content type explicitly.
- It carries `license`, `credit` and `sourcePage` onto every record, which is what makes the
  attribution survive the import rather than only the research. **CC BY-SA is share-alike** —
  redistributing into your app is fine, but the attribution is a condition, not a courtesy.

**Caveat, stated plainly:** the script parses and its logic is right, but it has never made a
successful live call, because Commons is unreachable from the session that wrote it. Run the dry
run first and read the per-stop output before `--apply`.

---

## If Commons comes up thin

Commons is well populated for the big landmarks — Toshogu, Kegon, Tsurugajo, Ouchi-juku, Ginzan,
Kawagoe, Tokyo Tower, Hitachi — and thin for the hotels, the airports, Shisui and Zao Fox Village.
Three fallbacks, in order:

1. **Openverse** (`api.openverse.org/v1/images/`) aggregates Flickr and museum collections and
   returns `license` and `creator` fields directly. Works from a normal network.
2. **Official venue press/media pages that grant reuse** — record `license: "official-permitted"`
   with the `sourcePage` that states the grant. Slower, one stop at a time, but it is explicitly
   permitted by RESEARCH_BRIEF §3g and it is the only route that works for the hotels.
3. **Your own photographs, after the trip.** `own` is in the validator's licence set, and this is
   the honest best answer for the seven hotels and the two airports — Trip 12 has an assigned
   photographer with a 35-photo minimum, and those images are unambiguously yours to redistribute.
   Worth remembering that after 15 September the image gap partly closes itself.

---

## What NOT to do

Do not scrape. RESEARCH_BRIEF §3g and §4.7 are explicit, `validate_research.py` rejects any image
without a licence, and the deploy step uploads these into your own Firebase Storage under
`users/{uid}/` — that is redistribution, and an unlicensed copy in a shipped app is a different
thing from a link in a browser tab.
