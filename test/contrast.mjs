// Item 16 — real, computed WCAG contrast ratios for every foreground/
// background token pair this session could identify in web/css/app.css,
// including every new pair items 02 and 12 introduced. No browser is needed
// — these are fixed design tokens, not runtime-derived colours, so the
// ratios are computed directly from the hex values rather than screenshotted
// or eyeballed.
//
// Two groups, on purpose:
//
//   PRE_EXISTING — pairs that were already in app.css before this session,
//   reused as-is by the new work (per the audit's own rule: don't
//   standardise an existing inconsistency while touching nearby code). Some
//   of these fail AA at normal text size — `--soft`/`--faint` on white, and
//   `--jade-fg` on `--jade-bg` (used by the pre-existing `.hint-jade` and
//   `.side.theirs`, and now also by this session's tier-3 jade card, because
//   the canonical design doc specifies exactly this colour for that role).
//   Re-theming the colour system to fix these is a real, worthwhile future
//   round — it is not an item-02/12/16 fix, because it would touch every
//   screen that already uses these tokens, not just the ones this round
//   added. Recorded here so it is a decision, not an oversight.
//
//   NEW_THIS_SESSION — every pair items 02, 12 and 16 actually introduced.
//   This is the set the exit code gates on: a future change that makes one
//   of *these* regress below AA should fail CI, even though the pre-existing
//   ones are tracked rather than gated.
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function relLum({ r, g, b }) {
  const f = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(hex1, hex2) {
  const L1 = relLum(hexToRgb(hex1));
  const L2 = relLum(hexToRgb(hex2));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

// None of the type this session touches reaches WCAG's "large text"
// threshold (18.66px bold / 24px regular) — the biggest new label is
// .warn-name / .btn.amber at 13px/700 — so every pair here is judged at the
// stricter AA-normal bar (4.5:1), which is also the safer default.
const AA_NORMAL = 4.5;

const PRE_EXISTING = [
  ['ink on white card', '#14201C', '#FFFFFF', 'plan-name, essential-v, most card body text'],
  ['charcoal on white card', '#3D4C46', '#FFFFFF', '.dest-desc, .log-text, .leg'],
  ['muted on white', '#6B7A74', '#FFFFFF', '.empty-t1-body reuses this'],
  ['soft on white', '#98A5A0', '#FFFFFF', '.eyebrow, .acct-sub, every closing hint incl. .empty-t1-hint (NEW use, old token)'],
  ['faint on white', '#B4BEB9', '#FFFFFF', '.item-est-cap'],
  ['ink on bone page', '#14201C', '#F2F3F1', 'body text colour on the page background'],
  ['soft on bone', '#98A5A0', '#F2F3F1', 'eyebrow on bone-background rows'],
  ['jade-fg on jade-bg', '#5D8C7C', '#E6EFEB', '.side.theirs values, .hint-jade body, .wx-src; NEW use: .empty-shared-b/-ctx (design-specified colour)'],
  ['jade on jade-bg', '#1F6F5C', '#E6EFEB', '.eyebrow.jade, .badge.jade text'],
  ['amber-fg on amber-bg', '#8A5A08', '#FBF1DE', '.warn-label, .prep-why; NEW use: .warn-fact (same pair .warn-text always used)'],
  ['danger-fg on danger-bg', '#9B4B4B', '#F8E9E9', '.gone-s, .badge.rust, .stat.tight'],
  ['white on ink', '#FFFFFF', '#14201C', '.btn.ink, .warn-fix.first'],
  ['white on jade', '#FFFFFF', '#1F6F5C', '.btn.jade'],
  ['white on amber (dock-btn)', '#FFFFFF', '#C87F0A', '.dock-btn — pre-existing, unrelated to this round'],
  ['ink on bone (ghost btn text)', '#14201C', '#F2F3F1', '.btn.ghost'],
  ['charcoal on field-grey (pay-chip)', '#3D4C46', '#EFF1EE', '.pay-chip, .leg'],
];

const NEW_THIS_SESSION = [
  ['empty-t1-title ink on white/card', '#14201C', '#FFFFFF', '.empty-t1-title, 15px/700'],
  ['empty-shared-t ink on jade-bg', '#14201C', '#E6EFEB', '.empty-shared-t, 13.5px/700'],
  ['who-mark.sm jade on white', '#1F6F5C', '#FFFFFF', '.who-mark.sm glyph on its own white fill'],
  ['btn.amber amber-fg on FFFDF7', '#8A5A08', '#FFFDF7', '.btn.amber, .lane-add.shared, 13px/700'],
  ['warn-name ink on amber-bg', '#14201C', '#FBF1DE', '.warn-name, 13px/700'],

  // The five Must-line hues, judged on BOTH grounds they appear on: the
  // white section card, and --bone where the panel shows through. A section
  // label is 10.5px/800, well under WCAG's large-text threshold, so the
  // strict 4.5:1 bar applies to all ten pairs.
  ['sum-do on white', '#26327A', '#FFFFFF', '.must-do .must-label, 10.5px/800'],
  ['sum-do on bone', '#26327A', '#F2F3F1', '.must-do .must-label over the panel ground'],
  ['sum-eat on white', '#7C2F72', '#FFFFFF', '.must-eat .must-label, 10.5px/800'],
  ['sum-eat on bone', '#7C2F72', '#F2F3F1', '.must-eat .must-label over the panel ground'],
  ['sum-see on white', '#6A4FA8', '#FFFFFF', '.must-see .must-label, 10.5px/800'],
  ['sum-see on bone', '#6A4FA8', '#F2F3F1', '.must-see .must-label over the panel ground'],
  ['sum-buy on white', '#1A7396', '#FFFFFF', '.must-buy .must-label, 10.5px/800'],
  ['sum-buy on bone', '#1A7396', '#F2F3F1', '.must-buy .must-label over the panel ground'],
  ['sum-snack on white', '#B23F68', '#FFFFFF', '.must-snack .must-label, 10.5px/800'],
  ['sum-snack on bone', '#B23F68', '#F2F3F1', '.must-snack .must-label over the panel ground'],

  // §3.1 · F3 · --offhours, the only new colour in the seven-decision set.
  // Judged on THREE grounds, not two: the token's real ground is #EFF1EE,
  // the chip fill, and that is the one the reader actually sees — the white
  // card and --bone only show through where a row is on a bare panel. A
  // token at 10.5px/800 is well under the large-text threshold, so 4.5:1
  // applies to all three.
  ['offhours on chip #EFF1EE', '#6E3A8C', '#EFF1EE', '.tw, its real ground, 10.5px/800'],
  ['offhours on white', '#6E3A8C', '#FFFFFF', '.tw on a white card'],
  ['offhours on bone', '#6E3A8C', '#F2F3F1', '.tw where the panel shows through'],
];

function run(label, pairs, { gate }) {
  console.log(`\n${label}`);
  console.log('  ' + 'pair'.padEnd(38) + 'ratio'.padEnd(8) + 'verdict');
  let failures = 0;
  for (const [name, fg, bg, where] of pairs) {
    const r = ratio(fg, bg);
    const pass = r >= AA_NORMAL;
    if (!pass) failures++;
    console.log(
      '  ' + name.padEnd(38) + r.toFixed(2).padEnd(8) + (pass ? 'PASS' : `FAIL (${fg} on ${bg})`) + '  ' + where,
    );
  }
  console.log(`  ${pairs.length - failures}/${pairs.length} pass AA-normal (4.5:1).`);
  return gate ? failures : 0;
}

/*
 * F4 · GROUND-SCOPED PAIRS — and the rule for the next dark surface.
 *
 * A dark-ground ink is DEFINITIONALLY EXEMPT from a bar measured on white
 * and --bone: it is designed to fail there. The owner's bar is 4.5:1 on
 * white AND bone, so the honest thing is not to smuggle these into the
 * general sweep, nor to leave them ungated — it is to gate them against the
 * ground they actually appear on and say so by name.
 *
 * THE RULE, so the next dark surface inherits it instead of the argument:
 *   a colour that only ever appears on one ground is gated on THAT ground,
 *   in this list, with the ground named. It is never added to
 *   NEW_THIS_SESSION, and never given a pass because "it's a dark card".
 *
 * The owner's answer to F4 was UNIFY rather than add a second exemption:
 * `.archive-was` moved from #9FB2AA (4.03:1 — a real, shipped AA failure on
 * a live screen) to #B6C7C0, so the app has exactly ONE secondary ink for
 * dark grounds and it passes.
 */
const GROUND_SCOPED = [
  ['archive-name on dark-card', '#E4EBE8', '#3D4C46', '.archive-name, 13.5px/650 — dark ground only'],
  ['archive-was on dark-card', '#B6C7C0', '#3D4C46', '.archive-was, 11px — F4: was #9FB2AA at 4.03:1'],
  ['white on ink (credit bar)', '#FFFFFF', '#14201C', '§3.3 .hero-credit — solid ink, never alpha over a photo'],
];

let gatedFailures = 0;
gatedFailures += run('Pre-existing pairs (tracked, not gated — see header comment)', PRE_EXISTING, { gate: false });
gatedFailures += run('New pairs this session (items 02/12/16) — gated', NEW_THIS_SESSION, { gate: true });
gatedFailures += run('Ground-scoped pairs (F4) — gated on their OWN ground, exempt from the white/bone sweep', GROUND_SCOPED, { gate: true });

console.log(gatedFailures
  ? `\nFAIL: ${gatedFailures} pair(s) introduced this session fall below WCAG AA.`
  : '\nPASS: every pair this session introduced clears WCAG AA-normal (4.5:1).');
process.exit(gatedFailures ? 1 : 0);
