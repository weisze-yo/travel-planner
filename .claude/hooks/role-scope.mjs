#!/usr/bin/env node
// PreToolUse on Edit|Write|MultiEdit, wired from a subagent's own frontmatter.
// Keeps the Engineer and the Tester out of each other's files, so a harness
// is never loosened to make an implementation pass, and a test is never
// "fixed" by changing the app it tests.
//
//   role-scope.mjs --only test/      edits allowed only under test/
//   role-scope.mjs --never test/     edits allowed anywhere except test/
import { relative, isAbsolute } from 'node:path';

const [mode, prefix] = process.argv.slice(2);
const input = JSON.parse(await new Promise((r) => {
  let s = ''; process.stdin.on('data', (c) => (s += c)); process.stdin.on('end', () => r(s || '{}'));
}));
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const raw = input.tool_input?.file_path || '';
if (!raw || !prefix) process.exit(0);
const rel = (isAbsolute(raw) ? relative(root, raw) : raw).split('\\').join('/');
// Scratch files outside the repo are always fine.
if (rel.startsWith('..')) process.exit(0);

const inside = rel.startsWith(prefix);
const blocked = (mode === '--only' && !inside) || (mode === '--never' && inside);
if (blocked) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: mode === '--only'
        ? `This role may only edit files under ${prefix}. Report what ${rel} needs to the orchestrator instead.`
        : `This role may not edit ${prefix}. If a harness is wrong, say so in your report — the Tester owns ${prefix}.`,
    },
  }));
}
