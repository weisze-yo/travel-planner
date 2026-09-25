#!/usr/bin/env node
// PostToolUse on Edit|Write|MultiEdit, for every agent.
//
// After any edit under src/, run test/guard.mjs: the module-parse sweep plus
// the backtick-in-an-HTML-comment trap, which parses fine and breaks the
// screen at runtime — it bit four times in round nine. It takes well under a
// second, so it runs on every edit and the failure lands next to its cause.
//
// `src/`, not `web/js/`: the app's source moved when the TypeScript conversion
// began, and `web/js/` is now build output that nothing should be editing by
// hand (protect-paths.mjs denies it outright). `.ts` as well as `.js`, since
// guard.mjs walks `src/` and the conversion is file by file.
import { execFileSync } from 'node:child_process';
import { relative, isAbsolute } from 'node:path';

const input = JSON.parse(await new Promise((r) => {
  let s = ''; process.stdin.on('data', (c) => (s += c)); process.stdin.on('end', () => r(s || '{}'));
}));
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const raw = input.tool_input?.file_path || '';
const rel = (isAbsolute(raw) ? relative(root, raw) : raw).split('\\').join('/');
if (!/^src\/.*\.(js|ts)$/.test(rel)) process.exit(0);

try {
  execFileSync(process.execPath, ['--experimental-vm-modules', 'test/guard.mjs'], { cwd: root, stdio: 'pipe' });
} catch (e) {
  const out = `${e.stdout || ''}${e.stderr || ''}`.split('\n').filter((l) => /BACKTICK|DOES NOT PARSE|^\s{6}/.test(l)).join('\n');
  console.log(JSON.stringify({
    decision: 'block',
    reason: `test/guard.mjs failed after editing ${rel}. Fix this before anything else — every harness will fail for the wrong reason until you do:\n${out}`,
  }));
}
