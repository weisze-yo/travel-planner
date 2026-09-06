# Runbook — backup and import Trip 12 into production

**Run on your own machine.** Everything here is copy-paste. The cloud session that wrote it has
never held the service-account key and must not be sent it.

Read the whole file once before starting. Steps 1–6 are safe and reversible. **Step 7 is the first
production write, and step 9 is the real trip.**

---

## What you need before you start

| | |
|---|---|
| Branch | `claude/inspiring-newton-uzu0mt` |
| Commit | see "Exact commit" below — `git log -1` after cloning should match |
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

**Check the commit matches "Exact commit" at the bottom of this file.** If it does not, you are
running different code than was tested.

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
places            565  167  398        (532 research + 33 stop places)
subRoutes          17    0   17
shopping           96   49   47
mustSee            60   34   26
days                8    8    0
prep               85   85    0

searchable records                     688
ids updated in place / inserted        250 / 488
nameJp coverage                        688 / 688
records flagged retired                29

stops  active / retired / with data    30 / 3 / 33
       day 7 active stops              5
       with a 5-line summary           33 / 33
       summary lines                   165
       correctedFromSeed entries       196
       with structured hours           33 / 33

duplicate venue pairs merged           20
coLocated pairs kept (both)            3
dangling anchorPlaceID                 0
records the merge could not map        0
nested arrays remaining                0
```

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

## Step 7 — import to a THROWAWAY tripId (first production write)

```sh
node scripts/import-trip12.mjs \
  --project travel-planner-3e0d3 \
  --uid w1kRlBbw6ChF3gaQXzDf5413EE03 \
  --key ~/.secrets/trip12-admin-key.json \
  --trip throwaway-t12
```

This writes to `users/<uid>/trips/throwaway-t12`, which is a separate trip and touches nothing else.

It will print the project, uid, tripId and full path, list the trips already under that uid, print
the whole merge report, and then **stop and ask you to type `throwaway-t12`** before writing.
Anything else aborts. Do not pass `--yes`.

Expect `wrote 840 documents.` and a read-back showing:

```
trip.startDate      : "2026-09-08" (string)
trip.prepCategories : [... seven entries, ending "Leave behind"]
days 8 · places 565 · subRoutes 17 · shopping 96 · mustSee 60 · prep 85 · log 0 · outfits 8
stops active 30 · retired 3 · with summary 33
```

## Step 8 — review the throwaway in the real app

Open **https://travel-planner-3e0d3.web.app**, signed in as `weisze.ai@gmail.com`. The trips home
will now list **ViTrox Japan Tohoku · Trip 12** alongside the demo. Open it.

Walk this list. Everything here was verified against the emulator and in the app with the same data,
so anything that does not match is worth stopping for:

- [ ] **8 days**, and **30 stops** across them, not 33.
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

A runbook cannot name its own commit — stamping one in produces a hash the file's own commit then
invalidates. So verify by content instead, which is what actually matters:

```sh
git checkout claude/inspiring-newton-uzu0mt
git pull origin claude/inspiring-newton-uzu0mt
git log --oneline -4
```

The four most recent subjects on this branch should be, newest first:

```
Drop the Ginza chip, prove archive/restore, and write the import runbook
Phase 2A/2B: the import gate, a real dry run, and a backup
Phase 1: let the web client hold the researched record shape
Add Trip 12 handoff documents and research bundle
```

If your tip is **newer** than the first of those, this runbook may be out of date — the dry run in
step 3 is the real check, so compare its output against the expected numbers there before going on.

The substantive verification is step 3. Those figures come from the merge, and if the code changed
in any way that matters they will move.
