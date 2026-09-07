# Runbook — backup and import Trip 12 into production

**Run on your own machine.** Everything here is copy-paste. The cloud session that wrote it has
never held the service-account key and must not be sent it.

Read the whole file once before starting. Steps 1–6 are safe and reversible. **Step 7 is the first
production write, and step 9 is the real trip.**

---

## What this re-import carries, if you have imported before

Seven things have changed in the data since the last write. None of them touches a field a
traveller has edited — the merge is field-wise, and the dry run reports **1294 fields preserved**
by it — but you should know what you are landing.

| | what lands | why it is safe |
|---|---|---|
| **the airport batch** | +59 records across Penang, Changi and Haneda: 43 places, 5 must-see, 8 shopping, 3 sub-routes | it emits no `essentials`, `stopSummary` or `outfitByStop` for Haneda, the one stop it overlaps, so there is nothing of Haneda's for it to overwrite. Verified by building the snapshot with and without it |
| **the `service` category** | 14 records move from `sight` to `service` — 4 at Penang, 1 at Changi, 8 at Haneda, 1 in the Day 1 batch | a category is a label, not a relationship; nothing anchors to it. The 17 coach-park records filed as `rest` are deliberately NOT touched — a separate, later pass |
| **item 4 · `onList: false`** | all 104 shopping items start OFF the main list, local to the place they were noted at | ticking one bought promotes it, one way. The direction of the default is the safety property: absent or true means listed, so no record written before the flag existed changes visibility |
| **the prep recategorisation** | 85 prep lines land in the seven approved columns | update-only, no inserts |
| **the Info-tab projection** | 575 nearby places gain 3935 `essentials` rows | additive; a place that had none had an empty tab |
| **the `steps[]` normalisation** | one canonical shape, applied at import | idempotent — running it twice produces the same bytes |
| **two text corrections** | Day 1's 07:00 note now carries SQ's 07:15 opening and 09:35 hard close; the Haneda onsen record carries the walkway-hours caveat | prose only |

**Not carried, and deliberately:** `outfitByStop` — 33 per-stop clothing records, ~1,400 characters
each, which nothing imports. `handoff/trip12/AUTONOMOUS_LOG.md` U1 explains why that is a design
question rather than an importer bug, and no importer change was made for it.

---

## What you need before you start

| | |
|---|---|
| Branch | `claude/inspiring-newton-uzu0mt` |
| Commit | the tip of that branch. **Not `main`** — main has none of this work. See "Which code this depends on" at the end. |
| Node | **v20 or newer** (v22 is what this was built and tested on). `node -v` |
| Firebase project | `travel-planner-3e0d3` |
| Your uid | `w1kRlBbw6ChF3gaQXzDf5413EE03` — verified live, Google, `weisze.ai@gmail.com` |
| Service-account key | a JSON file you generate below, **stored outside this repository** |

You do **not** need `firebase-tools`, the emulators, Java, or Playwright for the import. Those are
only for local testing. The importer needs one npm package.

### Getting the service-account key

1. Firebase console → the `travel-planner-3e0d3` project → the gear icon → **Project settings**.
2. **Service accounts** tab → **Generate new private key** → confirm. A JSON file downloads.
3. Move it somewhere outside the repo and lock it down. Anything works; this runbook assumes:

   ```sh
   mkdir -p ~/.secrets
   mv ~/Downloads/travel-planner-3e0d3-*.json ~/.secrets/trip12-admin-key.json
   chmod 600 ~/.secrets/trip12-admin-key.json
   ```

**This key bypasses `firestore.rules` completely.** The Admin SDK is not subject to them, so the key
is full read/write on every trip in the project. Keep it out of the repo, out of chat, out of
screenshots. `.gitignore` already covers `*serviceAccount*.json`, `*service-account*.json` and
`firebase-adminsdk-*.json` as a second line of defence — not as a reason to put it in the repo.

Delete or rotate the key in the console once you are done; it is not needed after step 9.

---

## Step 1 — get the code

```sh
git clone https://github.com/weisze-yo/travel-planner.git
cd travel-planner
git checkout claude/inspiring-newton-uzu0mt
git log -1 --oneline
```

If you already have the clone:

```sh
cd travel-planner
git checkout claude/inspiring-newton-uzu0mt
git pull origin claude/inspiring-newton-uzu0mt
git log -1 --oneline
```

**`main` will not work.** None of the importer, the research bundle or this file exists on it — the
branch has not been merged. Verify what you have with "Which code this depends on" at the end of
this file, then let step 3 confirm it.

## Step 2 — install the one dependency

```sh
cd scripts
npm install
cd ..
```

That installs `firebase-admin@^12.7.0` (tested against 12.7.0) into `scripts/node_modules/`, which
is gitignored. Nothing is installed globally and nothing else in the repo needs building — the web
app ships as untranspiled ES modules.

## Step 3 — dry run (writes nothing)

```sh
node scripts/import-trip12.mjs \
  --project travel-planner-3e0d3 \
  --uid w1kRlBbw6ChF3gaQXzDf5413EE03 \
  --dry-run
```

`--dry-run` does not load `firebase-admin` at all, so it cannot open a connection even by mistake.
No key is needed and none should be passed.

**Check these numbers before going on.** If any differ, stop and report them:

```
collection        total   update   insert
days                8    8    0
places            618  167  451
subRoutes          20    0   20
shopping          104   49   55
mustSee            65   34   31
prep               85   85    0
outfits             8    8    0

searchable records (places + mustSee + shopping)   744
ids updated in place / inserted                    250 / 557
nameJp coverage                                    704 / 744
records flagged retired                            29

stops  active / retired / with data    40 / 3 / 43
  of the active: researched / travel    30 / 10
       day 7 active stops              5
       with a 5-line summary           33 / 43
       summary lines                   165
       correctedFromSeed entries       196
       with structured hours           35 / 43

travel legs added                      10   (5 on day 1, 5 on day 8)
TIME FIX  Narita T1 South Wing         (none) -> 07:20

duplicate venue pairs merged           20
coLocated pairs kept (both)            3
places whose anchorStop changed        3
fields preserved by field-wise merge   1294
nearby places given an Info tab        575 (3935 rows)
shopping items starting OFF the list   104   (item 4)
shopping categories backfilled         54
cross-wired categories corrected       1
places with an invalid category        0
dangling anchorPlaceID                 0
records the merge could not map        0
nested arrays remaining                0
```

### What changed since the numbers above were first written

These are LARGER than the figures from the first import round, and every
increase is accounted for. If a number differs from this table, stop.

| line | was | now | why |
|---|---|---|---|
| places | 575 | 618 | the airport batch — 59 records, 16 of them merged into existing venues |
| subRoutes | 17 | 20 | three airport sub-routes, one per airport |
| shopping | 96 | 104 | eight airport buys |
| mustSee | 60 | 65 | five airport photo spots |
| outfits | *absent* | 8 | not a new record — §3.2 made the existing eight visible, so the report counts them now |
| searchable | 688 | 744 | the sum of the three above |
| nameJp | 688/688 | 704/744 | the 40 without one are the Penang and Singapore records. They have no Japanese name, and inventing one would be a fabrication |
| structured hours | 33/43 | 35/43 | the two airport stops that publish theirs |
| invalid category | *not reported* | 0 | `service` is a PlaceCategory now; the dry run is what caught the importer not knowing it |

## Step 4 — back up production (read-only)

**Do this before any write.** The import mutates documents that already exist — the shopping-category
backfill, the duplicate merges, two stop coordinates — so this is the only way back.

```sh
node scripts/backup-trip.mjs \
  --project travel-planner-3e0d3 \
  --uid w1kRlBbw6ChF3gaQXzDf5413EE03 \
  --key ~/.secrets/trip12-admin-key.json \
  --out ~/trip12-backup-$(date +%Y%m%d-%H%M).json
```

Omitting `--trip` backs up **every** trip under your uid, which is what you want here.

`backup-trip.mjs` opens no write of any kind and has no flag that makes it. It refuses to write its
output inside the repository.

> The managed `gcloud firestore export` is a Blaze-plan feature. This project is on Spark, so this
> Admin-SDK read-out to JSON is the backup.

## Step 5 — review the backup

The script prints a per-collection count for every trip it read, and whether the file exists. Open
the file and confirm it is not an empty shell:

```sh
ls -lh ~/trip12-backup-*.json
node -e "const b=require(process.argv[1]);for(const[t,e]of Object.entries(b.trips))console.log(t,Object.fromEntries(['days','places','subRoutes','shopping','mustSee','prep','log','outfits'].map(k=>[k,e[k].length])))" ~/trip12-backup-*.json
```

**If your account genuinely has no trips yet, the backup will be empty and that is correct** — there
is nothing to lose. It is also exactly what a mistyped uid looks like, so satisfy yourself which one
it is before continuing. You verified the uid live, so an empty result here just means a fresh
account.

## Step 6 — nothing to do

*(Step numbering kept aligned with the sequence you asked for; the local dry run is step 3.)*

## Step 6b — DEPLOY THE WEB APP

**Most of the work now lives in `web/`.** `deploy-web.yml` runs on a push to `main`, so whatever is
on `main` is what the app at travel-planner-3e0d3.web.app is running. No amount of hard-refreshing
reaches code that was never uploaded.

Without this step, none of the following is on the phone — all of it is code, not data, and none of
it arrives with the import:

- the seven Design sections: the select recipe, the outfit prose on Prep, the dawn/night marks and
  the `Now` filter, the image slot, the Add-a-stop dock, the Nearby restructure, and search
- the ten Bug Findings items on top of Bucket A's twenty
- **the `service` category's label.** Without the deploy, the 14 reclassified records land in
  Firestore with a category the running app does not recognise, and `categoryLabel` falls through
  to printing the raw string `service` on their cards. It is cosmetic and it is avoidable: deploy
  before you import, or in the same sitting.

Everything else in the trip is data and lands without it.

Either merge the branch to `main` and let the Action run, or deploy straight from the branch:

```sh
npx --yes firebase-tools@13 login
cp .firebaserc.sample .firebaserc     # set the project id to travel-planner-3e0d3
npx --yes firebase-tools@13 deploy --only hosting --project travel-planner-3e0d3
```

Then confirm the new build is actually live before reviewing:

```sh
curl -s https://travel-planner-3e0d3.web.app/js/store.js | grep -c holdsALoop   # expect 1 or more
curl -s https://travel-planner-3e0d3.web.app/sw.js       | grep -c offlineFallback  # expect 1
```

Both must be non-zero. Then hard-refresh the app (or close and reopen the PWA) so the new service
worker installs.

## Step 7 — import to a THROWAWAY tripId (first production write)

```sh
node scripts/import-trip12.mjs \
  --project travel-planner-3e0d3 \
  --uid w1kRlBbw6ChF3gaQXzDf5413EE03 \
  --key ~/.secrets/trip12-admin-key.json \
  --trip throwaway-t12b
```

**Use a NEW throwaway id.** The old `throwaway-t12` is not a clean slate: it was imported before the
stop-place model existed, the app then minted its own place records into it and saved them back, and
`set` + `merge` never deletes — so it now holds ~42 place records nothing points at. Reviewing it
measures that history, not this import. Delete it from the trips home (swipe left, bin) once the new
one looks right.

This writes to `users/<uid>/trips/throwaway-t12b`, which is a separate trip and touches nothing else.

It will print the project, uid, tripId and full path, list the trips already under that uid, print
the whole merge report, and then **stop and ask you to type `throwaway-t12b`** before writing.
Anything else aborts. Do not pass `--yes`.

Expect `wrote 850 documents.` and a read-back showing:

```
trip.startDate      : "2026-09-08" (string)
trip.prepCategories : [... seven entries, ending "Leave behind"]
days 8 · places 575 · subRoutes 17 · shopping 96 · mustSee 60 · prep 85 · log 0 · outfits 8
stops active 40 · retired 3 · with summary 33
```

40 active is 30 researched stops plus the 10 travel legs on days 1 and 8.

## Step 8 — review the throwaway in the real app

Open **https://travel-planner-3e0d3.web.app**, signed in as `weisze.ai@gmail.com`. The trips home
will now list **ViTrox Japan Tohoku · Trip 12** alongside the demo. Open it.

Walk this list. Everything here was verified against the emulator and in the app with the same data,
so anything that does not match is worth stopping for:

- [ ] **Day 1 opens with the outbound travel**, in order: 07:00 Assembly · Penang · 10:15 SQ131 ·
      11:45 Arrive Singapore · 13:55 SQ634 · 21:55 Haneda T3 · 21:55 Tour bus to the hotel ·
      then the hotel.
- [ ] **Day 8 runs 06:30 to 20:35**: Depart Yurakujo 06:30 · Narita T1 **07:20** · 10:55 SQ637 ·
      16:55 Arrive Singapore · 19:10 SQ142 · 20:35 Arrive Penang.
- [ ] **Day 2: the Zuiganji loop sits under Zuiganji Temple**, not at the bottom of the day. Every
      sub-route should sit under its own stop — 17 in total, none under a heading of its own at the
      end of a day.
- [ ] Sub-routes show their **real titles**, not "Free time".
- [ ] **8 days**, and **40 stops** across them (30 researched + 10 travel legs), 3 removed.
- [ ] **Day 7 has five stops** — Tokyo Tower 09:00, Tsukiji 10:50, **Ginza 13:45**, **Shisui 14:30**,
      Yurakujo 17:30. Ginza and Shisui overlap on purpose; that overlap is the signal, and you
      resolve it by removing one.
- [ ] **Day 2** shows **REMOVED FROM THIS DAY** with *Hotel Kameya, Naruko Onsen* under it. Same on
      Day 3 (*Okuiizaka Anabara Onsen Yoshikawaya*) and Day 4 (*Ooedo Onsen Monogatari Premium
      Kinugawa Kanko Hotel*).
- [ ] Tap a removed hotel — it **opens fully**, with its tabs and its hours, not a stub.
- [ ] **Day 1's hotel reads "Hotel Metropolitan Tokyo Haneda"** — the rename landed, and its places
      are still attached (Nearby 11).
- [ ] Open **Ginzan Onsen Street** (Day 3): **Nearby 31 · Must-see 4 · Shop 4**, and the Info tab
      shows an Hours row.
- [ ] Open **Tsukiji Outer Market** (Day 7): **Nearby 28 · Must-see 3 · Shop 9**.
- [ ] **Prep** shows all seven groups, including *Day bag* and *Leave behind*.
- [ ] **Trip settings** shows the currency rate at **33.7** with the fetch button.
- [ ] Browser console is clean.

**And the airport batch, which is new since the first round:**

- [ ] Open **Assembly · Penang International Airport** (Day 1, 07:00). Its note now names all three
      times: assemble 07:00, SQ opens check-in **07:15**, hard close **09:35**. Nearby should hold
      the four Penang service records — check-in counters, the ATM row, baggage wrapping, the telco
      counters — and each should read **Service** on its card, not "Sights" and not a raw `service`.
- [ ] Open **Haneda Airport — Terminal 3** (Day 1, 21:55). Its five Must lines and its Info rows
      must be **exactly as they were** — the airport batch deliberately emits none of those for
      Haneda, and this is the one stop where an overwrite would have been possible.
- [ ] Find **Izumi Tenku no Yu** in Haneda's Nearby. Its note now carries the CAVEAT: the walkway
      hours are unpublished, and the operator's own wording is 早朝から深夜まで, not 24時間.
- [ ] **Shop** opens saying nothing is on the list, and names the count — 104 items are waiting at
      their places, which is item 4 working, not an import that failed.

**And the app work, which needs step 6b rather than the import:**

- [ ] Every screen header has a **magnifier**. Tap it, type `銀山`, and a result should take you to
      the row and mark it.
- [ ] **Prep** shows two paragraphs of clothing advice per day, not "No forecast for this day yet".
- [ ] A stop's **Nearby tab** has a category select, a per-card sub-route dropdown, `+ Add a place`,
      and a dark card at the foot listing the day's free time. No round `+`, no bottom dock.
- [ ] A stop with no photo opens on **its own name**, with a white back bar — no hatched
      "Photo placeholder".

Try the removal round-trip once yourself, since it is the mechanism you will actually use on Day 7:
tap the pencil to edit, tap **✕** on Ginza, leave edit mode. It should drop into *REMOVED FROM THIS
DAY*, open fully when tapped, and come back via **Add back** (visible in edit mode) in its correct
clock position.

**If anything is wrong, stop here.** The real trip has not been touched. Fix, then re-run step 7 —
the importer is idempotent, so re-running only updates.

## Step 9 — import the real trip

Only after step 8 passes.

```sh
node scripts/import-trip12.mjs \
  --project travel-planner-3e0d3 \
  --uid w1kRlBbw6ChF3gaQXzDf5413EE03 \
  --key ~/.secrets/trip12-admin-key.json \
  --trip vitrox-trip12-tohoku \
  --allow-real-trip
```

Without `--allow-real-trip` the importer refuses this tripId outright. The flag is your assertion
that step 8 actually happened — it is not a formality, and it is the last thing standing between a
typo and the real trip.

It will prompt again. Type `vitrox-trip12-tohoku`.

Then repeat the step 8 checklist against **ViTrox Japan Tohoku · Trip 12** at the real id.

## Step 10 — clean up

Delete the throwaway trip from the trips home: swipe its row left and tap the bin. That removes
`users/<uid>/trips/throwaway-t12` and everything under it.

Then delete or rotate the service-account key in the Firebase console. It has no further use.

Keep the backup file.

---

## If something goes wrong

**The import failed part-way.** It writes in batches of 400, so a failure can leave a partial trip.
Just run the same command again: every write is `set` with `merge`, keyed by id, so a re-run
completes the job rather than duplicating it. Idempotency was proven by running it three times and
fingerprinting every document — identical each time.

**The trip does not appear in the app.** The near-certain cause is a uid mismatch, and it produces
no error anywhere: `firestore.rules` scopes everything to `request.auth.uid == userId`, so the wrong
uid simply returns nothing. Re-check `firebase.auth().currentUser.uid` in the browser console on the
deployed app and compare it against what you passed to `--uid`.

**You want to undo.** The backup from step 4 holds every document as it was. Nothing in this repo
restores it automatically — that is deliberate, because an automatic restore is a destructive write
with no gate in front of it. Say the word and it can be written, with the same gate the importer has.

---

## Which code this depends on

A document inside a repository cannot name the commit that contains it — stamping a hash in produces
one its own commit immediately invalidates. So the check is by content, and by the dry run.

```sh
git checkout claude/inspiring-newton-uzu0mt
git pull origin claude/inspiring-newton-uzu0mt
```

Confirm the branch carries all four pieces of work this runbook assumes. Order does not matter and
later commits are fine:

```sh
git log --oneline | grep -c -E "Add Trip 12 handoff documents|Phase 1: let the web client|Phase 2A/2B: the import gate|Drop the Ginza chip"
```

That must print **4**. And these must all exist:

```sh
ls scripts/import-trip12.mjs scripts/backup-trip.mjs scripts/lib/merge.mjs research/trip12/trip12_app_seed.json
```

**The substantive verification is step 3.** Those figures are computed by the merge from the research
bundle, so any change that matters to the import will move them. If the dry run prints what step 3
says it should, you are running the right code.
