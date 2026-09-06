#!/usr/bin/env node
//
// Imports Trip 12 into Firestore, idempotently.
//
// The gate in here is the point of the script, not decoration around it.
// `firebase/firestore.rules` scopes everything to `request.auth.uid == userId`,
// so a trip written under the wrong uid is not an error — it is silence. The
// rules simply return nothing, the owner's phone shows an empty account, and
// there is no message anywhere saying why. That is why this refuses to run
// without an explicit --uid and --project, prints what it is about to do, and
// makes you type the word back.
//
//   node scripts/import-trip12.mjs --project <id> --uid <uid> --dry-run
//   node scripts/import-trip12.mjs --project <id> --uid <uid> --emulator --trip throwaway-t12
//   node scripts/import-trip12.mjs --project <id> --uid <uid> --key <path> --trip vitrox-trip12-tohoku
//
// --dry-run does the entire merge in memory and prints what it WOULD do. It
// does not import firebase-admin at all, so it cannot open a connection even
// by accident. A throwaway tripId is not a dry run: it still writes.

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { existsSync } from 'node:fs';
import { buildSnapshot, TRIP_ID } from './lib/merge.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const RESEARCH = join(HERE, '..', 'research', 'trip12');
const GUIDE = join(HERE, '..', 'handoff', 'trip12', 'TRIP_IMPLEMENTATION_GUIDE.md');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const key = a.slice(2);
    if (['dry-run', 'emulator', 'yes'].includes(key)) out[key] = true;
    else out[key] = argv[++i];
  }
  return out;
}

const die = (msg) => { console.error(`\n  ${msg}\n`); process.exit(1); };
const n = (v) => String(v).padStart(5);

function printReport(report, target) {
  const p = report.perCollection;
  console.log('\n  what the merge produced');
  console.log('  ' + '-'.repeat(66));
  console.log('  collection        total   update   insert');
  for (const k of ['days', 'places', 'subRoutes', 'shopping', 'mustSee', 'prep', 'outfits']) {
    if (!p[k]) continue;
    console.log(`  ${k.padEnd(16)}${n(p[k].total)}${n(p[k].update)}${n(p[k].insert)}`);
  }
  console.log(`\n  searchable records (places + mustSee + shopping)   ${report.searchable}`);
  console.log(`  ids updated in place / inserted                    ${report.totals.update} / ${report.totals.insert}`);
  console.log(`  nameJp coverage                                    ${report.nameJp} / ${report.searchable}`);
  console.log(`  records flagged retired                            ${report.retiredRecords}`);

  const s = report.stops;
  console.log('\n  stops');
  console.log(`    active / retired / with data      ${s.active} / ${s.retired} / ${s.withData}`);
  console.log(`      of the active: researched / travel  ${s.researched} / ${s.travel}`);
  console.log(`    day 7 active stops                ${s.day7}`);
  console.log(`    with a 5-line summary             ${s.withSummary} / ${s.withData}`);
  console.log(`    summary lines                     ${s.summaryLines}`);
  console.log(`    correctedFromSeed entries         ${s.corrections}`);
  console.log(`    with structured hours             ${s.withHours} / ${s.withData}`);

  console.log('\n  stop id handling');
  for (const r of report.stopRenames) {
    console.log(`    RENAME   ${r.id}  ${r.from}`);
    console.log(`             ${' '.repeat(12)}-> ${r.to}   (id kept, no migration)`);
  }
  for (const r of report.stopReplacements) {
    if (r.retired) console.log(`    REPLACE  day ${r.day}  retire ${r.retired} -> add ${r.added}  ${r.addedName}`);
    else console.log(`    ADD      day ${r.day}  ${r.added}  ${r.addedName}`);
  }

  console.log('\n  travel legs added');
  for (const t of report.travelLegs) console.log(`    day ${t.day}  ${t.time}  ${t.id}  ${t.name}`);
  for (const t of report.timeFixes || []) console.log(`    TIME FIX  ${t.id}  ${t.name}  ${t.from} -> ${t.to}`);

  console.log(`\n  duplicate venue pairs merged        ${report.duplicateMerges.length}`);
  console.log(`  coLocated pairs kept (both)         ${report.coLocatedKept}`);
  console.log(`  places whose anchorStop changed     ${report.anchorChanges.length}`);
  for (const a of report.anchorChanges) console.log(`      ${a.id}  ${String(a.name).slice(0, 38)}  -> ${a.to}`);
  console.log(`  fields preserved by field-wise merge ${report.fieldWiseRescues}`);

  console.log('\n  stop coordinate fixes');
  for (const c of report.coordFixes) {
    console.log(`    ${c.id}  ${c.name}`);
    console.log(`      ${c.from.join(', ')}  ->  ${c.to.join(', ')}`);
  }

  const cross = report.categoryProblems.filter((c) => c.crossWired);
  const backfilled = report.categoryProblems.filter((c) => c.fix === 'souvenir');
  console.log(`\n  shopping categories backfilled to souvenir   ${backfilled.length}`);
  console.log(`  cross-wired categories corrected             ${cross.length}`);
  for (const c of cross) console.log(`      ${c.id}  ${c.name}  '${c.value}' -> '${c.fix}'`);
  const badPlaces = report.categoryProblems.filter((c) => c.collection === 'places');
  console.log(`  places with an invalid category              ${badPlaces.length}`);

  console.log(`\n  dangling anchorPlaceID              ${report.dangling.length}`);
  for (const d of report.dangling.slice(0, 10)) console.log(`      ${d.id} ${d.name} -> ${d.anchorPlaceID}`);
  console.log(`  records the merge could not map     ${report.unmappable.length}`);
  for (const u of report.unmappable.slice(0, 10)) console.log(`      ${JSON.stringify(u)}`);
  if (report.warnings.length) {
    console.log(`\n  warnings (${report.warnings.length})`);
    for (const w of report.warnings.slice(0, 12)) console.log(`      ${w}`);
  }
  console.log(`\n  Firestore shape conversions   hours ${report.shapeConversions.hours} · route coords ${report.shapeConversions.coords}`);
  console.log(`  undefined fields pruned       ${report.undefinedPruned}`);
  console.log(`  nested arrays remaining       ${report.nestedArrays.length}${report.nestedArrays.length ? '  <-- WOULD FAIL THE WRITE' : ''}`);
  for (const p of report.nestedArrays.slice(0, 5)) console.log(`      ${p}`);
  console.log(`\n  target tripId: ${target}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // ---- the gate. No defaults, no fallbacks, no auto-detection. ------------
  if (!args.project) die('REFUSING TO RUN: --project is required. There is no default and none is inferred.');
  if (!args.uid) die('REFUSING TO RUN: --uid is required. Read it from the signed-in session on the '
    + "device the owner will read the trip on — not from a document, not from memory. An anonymous "
    + 'uid is replaced the moment the user signs in.');

  const target = args.trip || null;
  const { snapshot, report } = buildSnapshot(RESEARCH, GUIDE);

  // Firestore rejects nested arrays with an error that names no field. Refuse
  // before opening a connection rather than failing mid-batch.
  if (report.nestedArrays.length) {
    die(`REFUSING TO RUN: ${report.nestedArrays.length} nested array(s) remain, which Firestore\n  `
      + `cannot store. First: ${report.nestedArrays[0]}\n  `
      + 'Add the shape to toFirestoreShape() in scripts/lib/merge.mjs.');
  }

  if (args['dry-run']) {
    console.log('\n  DRY RUN — firebase-admin is not loaded and nothing can be written.');
    console.log(`  project ${args.project}   uid ${args.uid}`);
    printReport(report, target || '(none given; a dry run needs no target)');
    console.log('\n  Nothing was written.\n');
    return;
  }

  if (!target) die('REFUSING TO RUN: --trip is required for a real write. Use a throwaway id first.');

  const real = target === TRIP_ID;
  if (real && !args['allow-real-trip']) {
    die(`REFUSING TO RUN: ${TRIP_ID} is the real trip.\n  `
      + 'Import to a throwaway --trip first, review the read-back in the app, then pass\n  '
      + '--allow-real-trip to confirm that review actually happened.');
  }

  if (!args.emulator && !args.key) {
    die('REFUSING TO RUN: --key <service-account.json> is required for a real project, or pass\n  '
      + '--emulator to write to the local Firestore emulator instead.');
  }
  if (args.key && !existsSync(resolve(args.key))) die(`Service-account key not found: ${args.key}`);

  // firebase-admin is imported only past this point, so --dry-run cannot reach it.
  const { default: admin } = await import('firebase-admin');

  if (args.emulator) {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
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

  console.log('\n  ' + '='.repeat(66));
  console.log('  ABOUT TO WRITE');
  console.log('  ' + '='.repeat(66));
  console.log(`    project   ${args.project}${args.emulator ? '   (EMULATOR)' : ''}`);
  console.log(`    uid       ${args.uid}`);
  console.log(`    tripId    ${target}${real ? '   *** THE REAL TRIP ***' : '   (throwaway)'}`);
  console.log(`    path      users/${args.uid}/trips/${target}`);

  // Does anything already live under this uid? Not a permission check — the
  // Admin SDK bypasses rules — but it does catch a uid with nothing under it,
  // which is the shape of a typo.
  const existing = await db.collection('users').doc(args.uid).collection('trips').get();
  console.log(`\n    trips already under this uid: ${existing.size}`);
  for (const d of existing.docs) console.log(`      ${d.id}  ${d.data()?.name || ''}`);
  if (existing.empty) {
    console.log('\n    NOTE: this uid has no trips at all. That is expected for a fresh');
    console.log('    account, and also exactly what a mistyped uid looks like. Be sure.');
  }

  printReport(report, target);

  if (!args.yes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`\n  Type the tripId (${target}) to write, anything else to abort: `);
    rl.close();
    if (answer.trim() !== target) die('Aborted. Nothing was written.');
  }

  // ---- write ---------------------------------------------------------------
  // set + merge, in batches under the 500-op limit, so running twice updates
  // and never duplicates.
  const tripRef = db.collection('users').doc(args.uid).collection('trips').doc(target);
  const KINDS = ['days', 'places', 'subRoutes', 'shopping', 'mustSee', 'prep', 'log', 'outfits'];

  let batch = db.batch();
  let ops = 0;
  let written = 0;
  const flush = async () => { if (ops) { await batch.commit(); batch = db.batch(); ops = 0; } };
  const put = async (ref, data) => {
    batch.set(ref, data, { merge: true });
    ops += 1; written += 1;
    if (ops >= 400) await flush();
  };

  await put(tripRef, { ...snapshot.trip, id: target });
  for (const kind of KINDS) {
    for (const row of snapshot[kind] || []) await put(tripRef.collection(kind).doc(row.id), row);
  }
  await flush();
  console.log(`\n  wrote ${written} documents.`);

  // ---- read back -----------------------------------------------------------
  console.log('\n  read-back');
  const tripSnap = await tripRef.get();
  console.log(`    trip document exists: ${tripSnap.exists}`);
  console.log(`    trip.name           : ${tripSnap.data()?.name}`);
  console.log(`    trip.startDate      : ${JSON.stringify(tripSnap.data()?.startDate)} (${typeof tripSnap.data()?.startDate})`);
  console.log(`    trip.prepCategories : ${JSON.stringify(tripSnap.data()?.prepCategories)}`);
  for (const kind of KINDS) {
    const snap = await tripRef.collection(kind).get();
    console.log(`    ${kind.padEnd(20)}${String(snap.size).padStart(5)}`);
  }
  const daysSnap = await tripRef.collection('days').get();
  const items = daysSnap.docs.flatMap((d) => d.data().items || []);
  console.log(`    stops active        ${items.filter((i) => !i.archived).length}`);
  console.log(`    stops retired       ${items.filter((i) => i.archived).length}`);
  console.log(`    stops with summary  ${items.filter((i) => i.stopSummary).length}`);
  console.log('');
}

main().catch((e) => { console.error(e); process.exit(1); });
