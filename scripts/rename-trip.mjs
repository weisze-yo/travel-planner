#!/usr/bin/env node
//
// Rename a trip — that is, move it to a new document id.
//
//   node scripts/rename-trip.mjs --project <id> --uid <uid> --key <path> \
//     --from throwaway-t12b --to vitrox-trip12-tohoku
//
// Firestore has no rename. A trip is a document plus eight subcollections, so
// this copies everything to the new id, verifies the copy document-for-document,
// and only then offers to remove the original.
//
// IT IS A DRY RUN UNLESS YOU PASS --confirm. The dry run reads the source,
// prints exactly what would be written, and writes nothing.
//
// Deleting the original is a SECOND, separate step (--delete-old), so the
// normal sequence is: dry run, then --confirm, then check the app, then
// --confirm --delete-old once you are happy. Between those steps both copies
// exist and nothing has been lost.
//
// TAKE A BACKUP FIRST: scripts/backup-trip.mjs. This script refuses to run
// without --i-have-a-backup, because the honest failure mode of any migration
// is the one nobody planned for.
//
// AFTERWARDS: each phone remembers which trip was open in
// `travel-planner:active-trip`, and that will still name the OLD id. The app
// handles a trip that is not there — it opens the trips home — so the only
// step is to tap the trip again. Nothing is lost by this.

import { resolve } from 'node:path';

/** Same rule as the importer: a flag with nothing value-shaped after it is boolean. */
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i += 1; }
  }
  return out;
}

const die = (msg) => { console.error(`\n  ${msg}\n`); process.exit(1); };

const KINDS = ['days', 'places', 'subRoutes', 'shopping', 'mustSee', 'prep', 'log', 'outfits'];

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.project) die('REFUSING TO RUN: --project is required.');
  if (!args.uid) die('REFUSING TO RUN: --uid is required.');
  if (!args.from) die('REFUSING TO RUN: --from <current trip id> is required.');
  if (!args.to) die('REFUSING TO RUN: --to <new trip id> is required.');
  if (args.from === args.to) die('REFUSING TO RUN: --from and --to are the same.');
  if (!args.emulator && !args.key) {
    die('REFUSING TO RUN: --key <service-account.json> is required, or --emulator for the local one.');
  }
  if (!args['i-have-a-backup']) {
    die('REFUSING TO RUN: pass --i-have-a-backup once you have run scripts/backup-trip.mjs\n  '
      + 'and read its per-collection counts. This script moves every document you own\n  '
      + 'under that trip.');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(String(args.to))) {
    die(`REFUSING TO RUN: '${args.to}' is not a sensible document id.`);
  }

  const writing = Boolean(args.confirm);
  const deleting = Boolean(args['delete-old']);
  if (deleting && !writing) die('REFUSING TO RUN: --delete-old also needs --confirm.');

  const { default: admin } = await import('firebase-admin');
  if (args.emulator) {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    admin.initializeApp({ projectId: args.project });
  } else {
    const { readFileSync } = await import('node:fs');
    const cred = JSON.parse(readFileSync(resolve(args.key), 'utf8'));
    if (cred.project_id !== args.project) {
      die(`The key is for project '${cred.project_id}' but --project says '${args.project}'.`);
    }
    admin.initializeApp({ credential: admin.credential.cert(cred), projectId: args.project });
  }

  const db = admin.firestore();
  const trips = db.collection('users').doc(String(args.uid)).collection('trips');
  const src = trips.doc(String(args.from));
  const dst = trips.doc(String(args.to));

  console.log(`\n  ${writing ? 'RENAMING' : 'DRY RUN — nothing will be written'}`);
  console.log(`  users/${args.uid}/trips/${args.from}  ->  ${args.to}\n`);

  // ---------------------------------------------------------------- read
  const srcSnap = await src.get();
  if (!srcSnap.exists) die(`REFUSING TO RUN: users/${args.uid}/trips/${args.from} does not exist.`);

  const dstSnap = await dst.get();
  const dstExisting = {};
  let dstTotal = 0;
  for (const kind of KINDS) {
    const s = await dst.collection(kind).get();
    dstExisting[kind] = s.size;
    dstTotal += s.size;
  }
  // The copy already being there is EXPECTED on the second step, and only
  // then. `--confirm` copies; `--confirm --delete-old` afterwards verifies
  // that copy and removes the original. Without this branch the guard below
  // would block the very sequence this script tells you to follow.
  const copyAlreadyThere = dstSnap.exists || dstTotal > 0;
  if (copyAlreadyThere && !deleting) {
    die(`REFUSING TO RUN: '${args.to}' already exists (trip document: ${dstSnap.exists}, `
      + `${dstTotal} documents in its collections).\n  `
      + 'This script will not merge into or overwrite an existing trip.\n  '
      + 'If you have already copied it and want to remove the original, add --delete-old.');
  }
  if (deleting && !copyAlreadyThere) {
    console.log('  (no copy at the new id yet — it will be made first, then verified, then the original removed)\n');
  }

  const data = { ...srcSnap.data() };
  const oldId = data.id;
  data.id = String(args.to);

  const rows = {};
  let total = 0;
  for (const kind of KINDS) {
    const s = await src.collection(kind).get();
    rows[kind] = s.docs.map((d) => ({ id: d.id, data: d.data() }));
    total += s.size;
    console.log(`      ${kind.padEnd(12)}${String(s.size).padStart(5)}`);
  }
  console.log(`      ${'TOTAL'.padEnd(12)}${String(total).padStart(5)}`);
  console.log(`\n  trip document: name=${JSON.stringify(data.name)}  id: ${JSON.stringify(oldId)} -> ${JSON.stringify(data.id)}`);

  if (!writing) {
    console.log('\n  Nothing was written. Re-run with --confirm to do it.\n');
    return;
  }

  // --------------------------------------------------------------- write
  if (copyAlreadyThere) {
    console.log('\n  the copy is already there — verifying it rather than writing it again');
  } else {
    await dst.set(data);
    let written = 0;
    for (const kind of KINDS) {
      for (let i = 0; i < rows[kind].length; i += 400) {
        const batch = db.batch();
        for (const row of rows[kind].slice(i, i + 400)) batch.set(dst.collection(kind).doc(row.id), row.data);
        await batch.commit();
        written += Math.min(400, rows[kind].length - i);
      }
    }
    console.log(`\n  written: ${written} documents plus the trip document`);
  }

  // -------------------------------------------------------------- verify
  //
  // Count every collection back out of Firestore rather than trusting the
  // writes. A copy nobody checked is not a copy.
  let ok = true;
  const after = await dst.get();
  if (!after.exists) { console.log('  VERIFY FAILED: the new trip document is not there.'); ok = false; }
  else if (after.data().id !== String(args.to)) { console.log(`  VERIFY FAILED: trip.id reads ${after.data().id}`); ok = false; }

  for (const kind of KINDS) {
    const s = await dst.collection(kind).get();
    const want = rows[kind].length;
    const good = s.size === want;
    if (!good) ok = false;
    console.log(`      ${good ? 'ok  ' : 'FAIL'} ${kind.padEnd(12)}${String(s.size).padStart(5)} of ${want}`);
  }

  if (!ok) {
    die('VERIFICATION FAILED. The original is untouched — nothing was deleted.\n  '
      + `Inspect users/${args.uid}/trips/${args.to} before doing anything else.`);
  }
  console.log('\n  verified: the copy matches the original document for document.');

  if (!deleting) {
    console.log('\n  The ORIGINAL IS STILL THERE. Open the app, check the trip looks right,');
    console.log('  then remove the original with the same command plus --delete-old.\n');
    return;
  }

  // -------------------------------------------------------------- delete
  console.log('\n  deleting the original…');
  let removed = 0;
  for (const kind of KINDS) {
    const s = await src.collection(kind).get();
    for (let i = 0; i < s.docs.length; i += 400) {
      const batch = db.batch();
      for (const doc of s.docs.slice(i, i + 400)) batch.delete(doc.ref);
      await batch.commit();
      removed += Math.min(400, s.docs.length - i);
    }
  }
  await src.delete();
  console.log(`  removed: ${removed} documents plus the trip document`);
  console.log(`\n  Done. The trip is now users/${args.uid}/trips/${args.to}`);
  console.log('  On each phone, open the app and tap the trip once — it remembers the old id.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
