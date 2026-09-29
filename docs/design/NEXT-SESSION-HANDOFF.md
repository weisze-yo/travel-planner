# Handoff — the full design pass (batches 2–8)

**Written:** 29 Sep 2026, at the end of the session that produced batch 1.
**For:** a new Claude Code session on this repository.
**Branch:** `claude/intelligent-pasteur-ebuo53`

---

## The prompt to start the new session with

Copy everything between the lines.

---

I am continuing a full UI/UX design pass on this travel-planner app. Batch 1 of 8
is done; you are picking up at batch 2.

**Read these first, in this order, before drawing anything:**

1. `CLAUDE.md` — the standing rules, the nine traps, the closed decisions, and how
   I want to be talked to (short and simple, detailed, like to a bright 15-year-old,
   and always end by saying clearly what to do next).
2. `docs/design/p3-information-architecture.md` — the navigation shape, the
   five-colour contract, dark mode, and the three widths. The other five P3
   documents hang off it and may not contradict it.
3. `docs/design/harbour-garden.html` — the approved design direction, revision 5.
   Open it in a browser. It has a working light/dark toggle.
4. `docs/design/harbour-garden-b1-core-loop.html` — batch 1, and the batch plan
   for all eight in a table near the top.
5. `docs/design/ui-ux-design-coverage.md` — the 71 screens and flows being covered.

**The most important lesson from batch 1, and the reason this handoff exists:**

I drew the place card — the sheet that Map, Plan and Must all open — **from memory
instead of from the source**, and it came out missing most of what the real screen
shows. Do not repeat that. **Read the screen module in `src/screens/` before drawing
any screen it owns**, and list in the artboard what you read.

**Your task — batch 2: Plan and Map.**

Cover coverage-matrix sections §C (3 rows) and §D (12 rows), plus the place card
redrawn properly:

- Plan — read, edit mode, empty day, empty day on a joined trip
- Add a stop; edit a stop's two times; the `not a time` refusal
- The two-stage delete ladder: `✕` → archive card → swipe → 6s undo
- Reorder by the grip; move a stop to another day; the `Moved to Day 4.` receipt
- Warnings on a row (the fact-first strip, four kinds)
- Free-time lane → new sub route
- Map home, day switching, the map sheet's three detents
- **The place card, redrawn from `src/screens/dest.js`** — see the correction below

Read at minimum: `src/screens/plan.js` (whole), `src/screens/dest.js` (whole),
`src/screens/map.js`, `src/screens/parts.js` (`swipeToDelete`, `bindDragReorder`,
`undoBar`, `emptyDay`, `dayPills`, `mapsLinks`), and `src/store.js`'s `dayIssues`.
Also read `docs/design/p1-plan-editing-design.md` — it is canonical for eight of
these interactions and settles them; you are restyling, not redesigning.

**Two corrections carried forward from batch 1:**

1. **The place card was under-built.** The real Destination screen has: a hero photo
   whose credit bar is a tappable link with an ↗; `MAIN ROUTE · STOP n` and time-window
   badges; name → subtitle → summary as three separate levels; **both** Google Maps and
   Apple Maps buttons; a `NO POSITION` warning strip with its own `Paste a map link`
   action; five tabs with counts (Info / Nearby / Must / Shop / Notes); `NEED TO KNOW`
   as label-value rows; and `Correct or add to this`. My sheet had about a third of it.
   **Open design question to answer in batch 2:** is the place card simply the
   Destination screen presented as a drag-up sheet — one thing at two heights — rather
   than a separate surface? I believe yes. Decide it and say so.

2. **Today's evening state** (batch 1 frame 08) keeps its "Day done" headline but must
   also show tomorrow's opening plan underneath, in the same timeline style as frame 07.
   Fold that fix into batch 2 rather than reissuing batch 1.

**How to deliver it:** one self-contained HTML file at
`docs/design/harbour-garden-b2-plan-and-map.html`, built the same way as batch 1 —
same colour tokens, same light/dark toggle, phone frames at 390 × 844, each frame
captioned with what it is and which matrix row it covers. Publish it as an artifact
so I can open it, then commit and push to `claude/intelligent-pasteur-ebuo53`,
committed in my name (Wei Sze Lim <wei-sze.lim@vitrox.com>).

No application code changes. Run `npm run test:guard` before you commit.

---

## What is already decided, and must not be re-opened

- The direction is **Harbour Garden**, revision 5. Five colours: cream ground, green
  as the app's own colour, blue meaning *a booking reference exists*, pink as a
  **function-only** colour (if pink is on screen there is something to press), brown
  for all text and for emergency.
- **Home has no tab bar.** Four tabs inside a trip: Today · Plan · Map · Pocket. Only
  the selected tab shows its label.
- **Pocket** holds Money, Phrases, Must, Log, Packing and Docs, opening as a six-tile
  hub before its chip row.
- **Gather lives on Today**, not on a tab.
- **Map is the overview; Plan is the editor.** They share one place card.
- Dark mode is a contract, not a feature: ten replaced token values, default `auto`.
- Three widths: phone, tablet (icon rail), desktop (rail + Plan beside Map).

## Two matrix rows that are now wrong, and must be rewritten in batch 8

`docs/design/ui-ux-design-coverage.md` § 3 still says:

- **Responsive** — "OUT OF SCOPE — one mobile layout, 520px cap"
- **Dark mode** — "OUT OF SCOPE — `color-scheme: light`"

Both were overtaken by decisions taken 28–29 Sep. The second is the expensive one:
dark mode being a contract means **all 71 rows need checking in both modes**, not
drawing once. Batch 8 rewrites both rows and the headline counts above them.

## Open question for the product owner, not for a session to settle

**AI-assisted trip creation.** Raised 29 Sep. It conflicts with two standing rules —
*no paid APIs* and *it must work offline* — so it is a product decision, not a design
one. Measured cost at current prices, for one trip built from a pasted itinerary
(~5k tokens in, ~6k out): about **$0.035 on Haiku 4.5**, **$0.07 on Sonnet 5.5**,
**$0.14 on Opus 5.5**.

The shape that does not break anything, if it is approved:

- It runs **only at trip creation**, never on the road, so the offline promise holds.
- Its output goes through **the existing paste-review flow**, row by row, so it can
  never write into a trip unreviewed.
- Paste and `.ics` import stay fully functional without it, so it is a layer and
  never a dependency.
- It belongs with the monetisation work in Phase 8, not in this design pass.

Do not design it into batches 2–8 unless the owner says to.
