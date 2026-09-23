#!/usr/bin/env node
// PreToolUse on Edit|Write|MultiEdit|NotebookEdit, for every agent.
//
// Refuses edits the repo's standing rules already forbid, so the rule holds
// even when a subagent never read HANDOFF.md:
//   TravelPlanner.swiftpm/   the parked native app — "do not touch it"
//   web/vendor/              pinned third-party files, never hand-edited
//   service-account keys     must live outside the repo (.gitignore says why)
//   trip backups             personal data; backup-trip.mjs refuses the repo too
import { relative, isAbsolute } from 'node:path';

const input = JSON.parse(await new Promise((r) => {
  let s = ''; process.stdin.on('data', (c) => (s += c)); process.stdin.on('end', () => r(s || '{}'));
}));
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const raw = input.tool_input?.file_path || input.tool_input?.notebook_path || '';
if (!raw) process.exit(0);
const rel = (isAbsolute(raw) ? relative(root, raw) : raw).split('\\').join('/');

const rules = [
  [/^TravelPlanner\.swiftpm\//, 'TravelPlanner.swiftpm/ is the parked native app — the standing rule is "do not touch it" (README.md, HANDOFF.md).'],
  [/^web\/vendor\//, 'web/vendor/ holds pinned third-party files (Leaflet, fonts, the vendored Firebase SDK). Do not hand-edit them.'],
  [/(serviceAccount|service-account|firebase-adminsdk-)[^/]*\.json$/i, 'Service-account keys must live outside this repository (.gitignore explains why).'],
  [/trip(12)?-backup[^/]*\.json$/i, 'Trip backups are personal data and must not be written inside the repo.'],
];

for (const [re, why] of rules) {
  if (re.test(rel)) {
    console.log(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: `${rel}: ${why}` },
    }));
    process.exit(0);
  }
}
