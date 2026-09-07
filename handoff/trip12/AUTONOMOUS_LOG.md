# Autonomous session log — 7 Sep 2026 onward

The owner stepped away mid-session and asked for the remaining work to be found, built and
verified without them. This file is the record: every decision taken without them, why, and
what would change if they disagree. It is also where anything **UNRESOLVED** is written down
rather than guessed at.

The one constraint that does not move: **the real Firestore production write is never run from
this session.** The dry run, the verification and the exact final commands are prepared; the
write is the owner's, on their own machine, with their own key.

## Build order, and whose authority it is

The owner's instruction was to respect the build order the Design canvases specify. They do,
in `Seven Decisions.dc.html` §04:

> **§3.5 → §3.2 → §3.1 → §3.3 → §3.6 → §3.7 → §3.4**

§3.5 first because it is a *dependency* — §3.7's two new controls are drawn on it, so shipping
it later means drawing it twice. §3.1 before §3.7 so the tab restructure is drawn against the
row it will actually ship with.

The `Bug Findings Design.dc.html` canvas carries its own order for its ten items — the sixteen
code bugs first (all sixteen already shipped in `d267f50` and `a0569d3`), then B2 and B4, then
B3/B1/B5, then B7, then B6/B8/B9/B10. Where the two canvases overlap, **Seven Decisions is
canonical**: the Bug Findings canvas says so itself — "Four are already answered in the
seven-decision brief … and are not repeated here" (the select, the paid box, the Add-a-stop
card, the Nearby restructure).

## Decisions taken without the owner

### 1 · The PAID field is 38px, from B7, not §3.5's 26px

The two canvases disagree, and the disagreement is substantive rather than a rounding error.
`Seven Decisions` §3.5 draws PAID at **26px / 12px**, sharing one line with the two selects, and
says out loud "both controls and the PAID field now agree". `Bug Findings` B7 draws it at
**38px / 15px** on a line of its **own**, with the estimate beside it, and argues "the money you
are typing is the one thing on this screen worth 15px".

The authority rule says §3.5 wins where they overlap. **They do not actually overlap.** §3.5's
figure describes a single-line layout; B7's describes a two-line one. The layout that already
shipped — bug 24's fix, `.paid-wrap { flex: 1 0 100% }` — is B7's: PAID claims the full width and
the selects sit above it. So B7's sizing is the spec for the layout that exists, and applying
§3.5's 26px to it would be applying a figure drawn for a different arrangement.

It is also the answer to the report. The bug was "the box is too small to read... can't visualize
how much has been entered at all", measured at an 18px sliver. 26px and 12px is barely more than
that; 38px and 15px is a number you can read while paying.

**Reversing it** is one CSS block, `.paid-input` in `app.css`, and one assertion in
`test/select-recipe.mjs`.

### 2 · The 1.5px PAID border is authored, not measured

`test/select-recipe.mjs` expects the computed border to be **1px**, not the authored 1.5px, and
proves why in the same render: a bare `border: 1.5px` div computes to 1px too. Chrome floors
fractional borders. 1.5px stays in the stylesheet because it is the app's own precedent
(`.btn-dashed`, `.plan-card.sub`, the sheet-class ink border) and because Safari — the actual
target, an iPhone 13 — paints it. The test asserts the app and a bare div agree, so a real
override would still be caught.

## UNRESOLVED — needs the owner

Nothing yet.
