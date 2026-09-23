// The build: src/ -> web/js/
//
// Two rules, and the second one matters as much as the first.
//
//   .ts  goes through tsc, one file to one file, same name
//   .js  is COPIED BYTE FOR BYTE
//
// The copy is not laziness. Routing the unconverted JavaScript through tsc as
// well works, but it reformats it — collapsed imports, four-space indents,
// blank lines stripped, one-line `if`s expanded — so `store.js` alone produced
// five thousand lines of diff that changed no behaviour. That noise would hide
// the real changes in every review from here to the end of the conversion, and
// it would make the shipped file stop matching the file people read. Only what
// has actually been converted is allowed to look different.
//
// There is no bundler, deliberately. `web/sw.js` carries a hand-written list
// of every JS file and that list is what makes the app work with no signal;
// hashed filenames would break the offline shell silently, which is the one
// failure nobody notices in a browser tab.
import { execFileSync } from 'node:child_process';
import { readdirSync, mkdirSync, copyFileSync, rmSync, existsSync, statSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = dirname(fileURLToPath(import.meta.url));
const SRC = join(REPO, 'src');
const OUT = join(REPO, 'web/js');

const walk = (dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

if (!existsSync(SRC)) {
  console.error(`\n  No ${relative(REPO, SRC)}/ — nothing to build.\n`);
  process.exit(1);
}

// web/js is generated in full, so stale output from a renamed or deleted
// source cannot survive a build and quietly keep being served.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const files = walk(SRC);
const ts = files.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));
const js = files.filter((f) => f.endsWith('.js'));
const other = files.filter((f) => !f.endsWith('.ts') && !f.endsWith('.js'));

if (ts.length) {
  try {
    execFileSync('npx', ['tsc', '-p', 'tsconfig.build.json'], { cwd: REPO, stdio: 'inherit' });
  } catch {
    console.error('\n  BUILD FAILED: tsc reported errors.\n');
    process.exit(1);
  }
}

for (const file of js) {
  const target = join(OUT, relative(SRC, file));
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(file, target);
}
for (const file of other) {
  const target = join(OUT, relative(SRC, file));
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(file, target);
}

// Every source must have produced exactly one output. A .ts that tsc skipped
// would otherwise be a module that silently stopped shipping.
let missing = 0;
for (const file of [...ts, ...js]) {
  const expected = join(OUT, relative(SRC, file).replace(/\.ts$/, '.js'));
  if (!existsSync(expected)) { console.error(`  MISSING OUTPUT: ${relative(REPO, expected)}`); missing += 1; }
}
if (missing) {
  console.error(`\n  BUILD FAILED: ${missing} source file(s) produced no output.\n`);
  process.exit(1);
}

// ---------------------------------------------------------- the offline shell
//
// `web/sw.js` precaches a hand-written list of every file, and that list is the
// whole of the app's offline promise. Nothing checked it, and three modules had
// already slipped out: currency.js, install.js and search.js were added in
// later rounds and never listed, all three on the boot path. A phone that
// installed the app and had not yet opened it a second time online did not boot
// at all with no signal — and the window reopens on every deploy, because the
// cache is named after sw.js's VERSION and `activate` deletes the rest.
//
// It was invisible from every direction: no error is thrown, the boot cover
// simply never clears; a second online load repairs it, because the service
// worker is controlling by then and caches what it fetches; and no harness
// could have seen it, since all of them set `serviceWorkers: 'block'`.
//
// Both directions are checked. A file listed but not emitted is just as bad and
// just as silent: `install` calls `cache.add(url).catch(() => {})`, so a 404
// there is swallowed and the shell is quietly short by one.
const sw = readFileSync(join(REPO, 'web/sw.js'), 'utf8');
const assets = [...sw.matchAll(/'\.\/(js\/[^']+)'/g)].map((m) => m[1]);
const emitted = walk(OUT).map((f) => `js/${relative(OUT, f).split('\\').join('/')}`).filter((f) => f.endsWith('.js'));

const unlisted = emitted.filter((f) => !assets.includes(f)).sort();
const phantom = assets.filter((f) => !emitted.includes(f)).sort();

if (unlisted.length || phantom.length) {
  console.error('\n  BUILD FAILED: web/sw.js does not match what the build emits.\n');
  if (unlisted.length) {
    console.error('  Missing from the ASSETS list — these would not be cached, so the app');
    console.error('  would fail to boot with no signal until it is next opened online:');
    for (const f of unlisted) console.error(`      './${f}',`);
  }
  if (phantom.length) {
    console.error('\n  Listed but not emitted — `install` swallows the 404 and the shell is');
    console.error('  quietly short by one. Remove these from ASSETS:');
    for (const f of phantom) console.error(`      './${f}'`);
  }
  console.error('\n  Edit the ASSETS array in web/sw.js, and bump VERSION so phones that');
  console.error('  already installed the old shell pick the new one up.\n');
  process.exit(1);
}

const bytes = walk(OUT).reduce((n, f) => n + statSync(f).size, 0);
console.log(`\n  built  ${ts.length} compiled · ${js.length + other.length} copied · `
  + `${(bytes / 1024).toFixed(0)} kB into ${relative(REPO, OUT)}/`);
console.log(`  offline shell: ${assets.length} modules listed in sw.js, all present\n`);
