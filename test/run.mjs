// `npm test` — the whole browser suite, one command.
//
// Until now running the tests meant: start `http-server` on 8099 by hand from
// web/, start `test/serve.mjs` on 8123 in a second terminal, then run
// twenty-eight scripts one at a time and add up the PASS lines yourself. There
// was no manifest naming Playwright, no `npm test`, and no total. That is the
// practical reason the suite was never wired into CI, and the reason nobody
// noticed the documented check count had drifted from 485 to 914.
//
// This starts both servers, runs every harness, adds them up, and exits
// non-zero if anything failed.
//
//   node test/run.mjs                 everything that does not need emulators
//   node test/run.mjs --jobs 4        four browsers at once (faster, less stable)
//   node test/run.mjs --only search   just the harnesses whose name matches
//   node test/run.mjs --junit out.xml also write JUnit XML, for CI annotations
//
// The two emulator harnesses (two-phones, refused-rules) are NOT run here:
// they need `test/setup.sh` and a running Firebase emulator pair, so they are
// a separate CI job. `guard.mjs` is not run here either — it is the static
// check that should run BEFORE this, and it is its own npm script.
import { spawn } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(TEST_DIR);

/** Not harnesses: infrastructure, the static guard, and the emulator pair. */
const NOT_A_HARNESS = new Set(['serve.mjs', 'run.mjs', 'guard.mjs', 'two-phones.mjs', 'refused-rules.mjs']);

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : (args[i + 1] ?? true);
};
const jobs = Math.max(1, Number(flag('--jobs', 1)));
const only = flag('--only', null);
const junitPath = flag('--junit', null);

const harnesses = readdirSync(TEST_DIR)
  .filter((n) => n.endsWith('.mjs') && !NOT_A_HARNESS.has(n))
  .filter((n) => (only ? n.includes(String(only)) : true))
  .sort();

if (!harnesses.length) {
  console.error(`No harnesses matched${only ? ` --only ${only}` : ''}.`);
  process.exit(1);
}

// ------------------------------------------------------------- the servers
//
// Both are `serve.mjs`. The harnesses split across two ports for historical
// reasons — 8099 was an `http-server` started by hand — and only the 8123 one
// needs the SPA rewrite for `/j/CODE`. Serving both from the same script means
// one dependency fewer and one manual step fewer; the rewrite is harmless on
// the other port because no harness asks for a URL it expects to 404.
const servers = [];

/** Is something already answering there? A developer often has one running. */
async function alreadyServing(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/index.html`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Start a server, unless the port is already serving the app — in which case
 * reuse it and say so. Without this the spawn dies on EADDRINUSE, prints a
 * stack trace, and the run carries on anyway against the other server, which
 * looks exactly like a passing run with a frightening error in the middle.
 */
async function startServer(port) {
  if (await alreadyServing(port)) {
    console.log(`  reusing the server already on ${port}`);
    return null;
  }
  const child = spawn(process.execPath, [join(TEST_DIR, 'serve.mjs')], {
    cwd: REPO,
    env: { ...process.env, TP_SPA_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', (d) => process.stderr.write(`  [server ${port}] ${d}`));
  servers.push(child);
  return child;
}

async function waitFor(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch { /* not up yet */ }
    if (Date.now() > deadline) throw new Error(`${url} did not come up within ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, 200));
  }
}

const stopServers = () => { for (const s of servers) s.kill('SIGTERM'); };
process.on('exit', stopServers);
process.on('SIGINT', () => { stopServers(); process.exit(130); });

// --------------------------------------------------------------- the runs
function runOne(name) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [join(TEST_DIR, name)], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code) => {
      const ok = (out.match(/^ {2}ok {2}/gm) || []).length;
      const failed = (out.match(/^ {2}FAIL /gm) || []).length;
      resolve({ name, code, ok, failed, ms: Date.now() - started, out });
    });
  });
}

async function runAll(names, concurrency) {
  const queue = [...names];
  const results = [];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      const r = await runOne(next);
      results.push(r);
      const bad = r.code !== 0 || r.failed > 0;
      console.log(
        `  ${bad ? 'FAIL' : 'ok  '} ${r.name.replace(/\.mjs$/, '').padEnd(28)}`
        + `${String(r.ok).padStart(4)} checks  ${String(Math.round(r.ms / 1000)).padStart(3)}s`
        + (r.failed ? `  ${r.failed} FAILED` : '')
        + (r.code !== 0 && !r.failed ? `  (exit ${r.code})` : ''),
      );
      if (bad) process.stdout.write(r.out.split('\n').filter((l) => /FAIL|Error|error:/.test(l)).slice(0, 12).map((l) => `        ${l}\n`).join(''));
    }
  });
  await Promise.all(workers);
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

function junit(results) {
  const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const suites = results.map((r) => {
    const failures = r.failed || (r.code !== 0 ? 1 : 0);
    const body = failures
      ? `<testcase name="${esc(r.name)}"><failure message="${esc(`${failures} failed, exit ${r.code}`)}">${esc(r.out.slice(-4000))}</failure></testcase>`
      : `<testcase name="${esc(r.name)}"/>`;
    return `<testsuite name="${esc(r.name)}" tests="${r.ok + failures}" failures="${failures}" time="${(r.ms / 1000).toFixed(1)}">${body}</testsuite>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n${suites.join('\n')}\n</testsuites>\n`;
}

console.log(`\n  ${harnesses.length} harnesses · ${jobs} at a time\n`);

await startServer(8099);
await startServer(8123);
await Promise.all([waitFor('http://127.0.0.1:8099/index.html'), waitFor('http://127.0.0.1:8123/index.html')]);

const results = await runAll(harnesses, jobs);
stopServers();

const checks = results.reduce((n, r) => n + r.ok, 0);
const failed = results.reduce((n, r) => n + r.failed, 0);
const crashed = results.filter((r) => r.code !== 0 && !r.failed);

console.log(`\n  ${results.length} harnesses · ${checks} checks · ${failed} failed`
  + (crashed.length ? ` · ${crashed.length} crashed (${crashed.map((c) => c.name).join(', ')})` : ''));
console.log(`  ${failed || crashed.length ? 'SUITE FAILED' : 'SUITE PASSED'}\n`);

if (junitPath) {
  writeFileSync(junitPath, junit(results), 'utf8');
  console.log(`  junit: ${junitPath}\n`);
}

process.exit(failed || crashed.length ? 1 : 0);
