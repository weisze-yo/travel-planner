#!/usr/bin/env node
// PreToolUse on Bash, for every agent.
//
// `main` is production: every push that touches web/, firebase.json or the
// rules deploys (.github/workflows/deploy-web.yml). So a push to main, a
// force push, a manual deploy, or a real (non-dry-run) Trip 12 import stops
// and asks the person — it is never something a subagent decides alone.
const input = JSON.parse(await new Promise((r) => {
  let s = ''; process.stdin.on('data', (c) => (s += c)); process.stdin.on('end', () => r(s || '{}'));
}));
const cmd = String(input.tool_input?.command || '');

const decide = (permissionDecision, reason) => {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason: reason },
  }));
  process.exit(0);
};

// Split on shell separators so `git add . && git push origin main` is seen.
for (const part of cmd.split(/&&|\|\||;|\n/).map((s) => s.trim())) {
  if (/^git\s+push\b/.test(part)) {
    if (/(\s|^)(-f|--force)(\s|$)|--force-with-lease|\s\+\S/.test(part)) {
      decide('ask', 'Force push rewrites published history. Confirm with the person first.');
    }
    if (/(\s|:)main(\s|$)|HEAD:main\b/.test(part)) {
      decide('ask', 'Pushing to main deploys to production (deploy-web.yml). Confirm with the person first.');
    }
  }
  if (/\bfirebase(-tools(@\S+)?)?\s+deploy\b/.test(part)) {
    decide('ask', 'Deploys go through CI on push to main; a manual firebase deploy bypasses it. Confirm first.');
  }
  if (/scripts\/import-trip12\.mjs/.test(part) && !/--dry-run|--emulator/.test(part)) {
    decide('ask', 'This import writes to a real Firestore project (handoff/trip12/RUNBOOK.md). Confirm first, or use --dry-run.');
  }
}
