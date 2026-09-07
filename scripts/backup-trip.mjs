#!/usr/bin/env node
//
// Reads a trip out of Firestore to a JSON file. Read-only: it opens no write
// of any kind, and there is no flag that makes it write.
//
// This exists because the import mutates documents that are already there —
// the shopping-category backfill, the duplicate merges, two stop coordinates —
// and `WEB_APP_GUIDE.md` puts this project on the Spark plan, where the managed
// `gcloud firestore export` is not available. So the backup is a plain read-out.
//
//   node scripts/backup-trip.mjs --project <id> --uid <uid> --key <path> \
//     --trip vitrox-trip12-tohoku --out ../trip12-backup.json
//
// Write the output OUTSIDE the repository. A trip export is personal data and
// has no business in version control.

import { resolve, dirname } from 'node:path';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';

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
  if (!args.out) die('REFUSING TO RUN: --out <path> is required. Put it outside the repository.');
  if (!args.emulator && !args.key) {
    die('REFUSING TO RUN: --key <service-account.json> is required, or --emulator for the local one.');
  }

  const outPath = resolve(args.out);
  if (outPath.includes(`${resolve('.')}/`) && !args['allow-in-repo']) {
    die(`REFUSING TO RUN: ${outPath} is inside the repository.\n  `
      + 'A trip export is personal data. Write it somewhere else, or pass --allow-in-repo\n  '
      + 'if you have genuinely checked it is ignored.');
  }

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

  const tripsRef = db.collection('users').doc(args.uid).collection('trips');
  const wanted = args.trip ? [args.trip] : (await tripsRef.get()).docs.map((d) => d.id);

  const backup = {
    takenAt: new Date().toISOString(),
    project: args.project,
    uid: args.uid,
    emulator: Boolean(args.emulator),
    trips: {},
  };

  console.log(`\n  reading users/${args.uid}/trips  (${wanted.length} trip${wanted.length === 1 ? '' : 's'})`);
  for (const tripId of wanted) {
    const tripSnap = await tripsRef.doc(tripId).get();
    const entry = { exists: tripSnap.exists, trip: tripSnap.exists ? tripSnap.data() : null };
    console.log(`\n    ${tripId}${tripSnap.exists ? '' : '   (no trip document)'}`);
    for (const kind of KINDS) {
      const snap = await tripsRef.doc(tripId).collection(kind).get();
      entry[kind] = snap.docs.map((d) => d.data());
      console.log(`      ${kind.padEnd(12)}${String(snap.size).padStart(5)}`);
    }
    backup.trips[tripId] = entry;
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(backup, null, 2), 'utf8');

  // A backup nobody checked is not a backup. Say what is in it, per collection,
  // so an empty read-out cannot be mistaken for a successful one.
  console.log(`\n  written: ${outPath}`);
  let empty = 0;
  for (const [tripId, entry] of Object.entries(backup.trips)) {
    const counts = KINDS.map((k) => `${k} ${entry[k].length}`).join(' · ');
    const total = KINDS.reduce((n2, k) => n2 + entry[k].length, 0);
    if (!entry.exists && total === 0) empty += 1;
    console.log(`    ${tripId}: ${counts}`);
  }
  if (empty) console.log(`\n  NOTE: ${empty} trip(s) held nothing at all. That is a real state for a`
    + '\n  fresh account, and also what a wrong uid looks like.');
  console.log(`  existsSync(out) = ${existsSync(outPath)}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
