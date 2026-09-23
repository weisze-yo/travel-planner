// Type-checking as a ratchet, not a cliff.
//
// `tsc` over 22,000 lines of JavaScript that was never written with types in
// mind reports 66 errors. Two obvious responses are both wrong:
//
//   fix all 66 first   nothing else happens for a day, and the fixes are
//                      mostly JSDoc annotations on code nobody is touching
//   leave it red       a permanently failing check teaches everyone to ignore
//                      a failing check, which costs more than it ever saves
//
// So the gate is the DIRECTION. The committed baseline is the count as it
// stands; CI fails if it goes up, and tells you to lower it when it goes down.
// New code cannot add type errors, existing debt shrinks whenever someone is
// in the file anyway, and the day it reaches zero this becomes an ordinary
// `tsc --noEmit` gate.
//
//   node test/typecheck.mjs            check against the baseline
//   node test/typecheck.mjs --update   record the current count as the baseline
//   node test/typecheck.mjs --list     print the errors themselves
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const BASELINE = join(REPO, 'test/typecheck-baseline.json');

const args = process.argv.slice(2);
const updating = args.includes('--update');
const listing = args.includes('--list');

let output = '';
try {
  execFileSync('npx', ['tsc', '--noEmit'], { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) {
  // tsc exits non-zero when it reports anything, which is the normal case here.
  output = `${e.stdout || ''}${e.stderr || ''}`;
}

const errors = output.split('\n').filter((l) => /error TS\d+/.test(l));
const count = errors.length;

// Syntax errors are TS1xxx, and they are never part of the baseline.
//
// When tsc cannot PARSE a file it stops analysing it, so the type errors that
// file used to report vanish and the total goes DOWN. A ratchet that only
// watches the count therefore reads a broken file as an improvement — which is
// exactly what happened the first time this was tested. Any TS1xxx fails
// immediately, whatever the count says.
const syntax = errors.filter((l) => /error TS1\d{3}:/.test(l));
if (syntax.length) {
  console.error('\n  SYNTAX ERRORS — tsc cannot parse these, so the count below is meaningless:\n');
  for (const line of syntax.slice(0, 20)) console.error(`    ${line}`);
  console.error('');
  process.exit(1);
}

if (listing) {
  for (const line of errors) console.log(`  ${line}`);
  console.log('');
}

// A count of zero with no output at all can also mean tsc never ran. Say so
// rather than quietly recording a baseline of 0 and gating on nothing.
if (count === 0 && output.trim() && !/error TS/.test(output)) {
  console.error(`\n  tsc produced output that is not type errors — refusing to trust a count of 0:\n\n${output.slice(0, 800)}\n`);
  process.exit(1);
}

if (updating) {
  writeFileSync(BASELINE, `${JSON.stringify({ errors: count, updated: new Date().toISOString().slice(0, 10) }, null, 2)}\n`);
  console.log(`\n  baseline recorded: ${count} type errors\n`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error('\n  No baseline. Record one with:  node test/typecheck.mjs --update\n');
  process.exit(1);
}

const { errors: allowed } = JSON.parse(readFileSync(BASELINE, 'utf8'));

if (count > allowed) {
  console.error(`\n  TYPE ERRORS WENT UP: ${count}, baseline is ${allowed}.`);
  console.error('  Something new is not type-safe. The errors:\n');
  for (const line of errors.slice(0, 40)) console.error(`    ${line}`);
  console.error('\n  Fix them, or see them all with:  node test/typecheck.mjs --list\n');
  process.exit(1);
}

if (count < allowed) {
  console.log(`\n  ${count} type errors, down from ${allowed}. Lower the baseline:`);
  console.log('    node test/typecheck.mjs --update\n');
  process.exit(1);
}

console.log(`\n  ${count} type errors, unchanged from the baseline.\n`);
process.exit(0);
