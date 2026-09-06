# Post-implementation QA — the discrepancy backlog

**Opened 6 Sep 2026, against production commit `2a200a3`.**
**Status: intake open. Nothing in this document has been implemented.**

The design was approved, then built, and now somebody is looking at the
running app with the design package beside them. That third step always finds
things, and the things it finds are not all the same kind of thing — some are
defects, some are the design being wrong, some are the design being silent.
This document is where they are recorded, classified and decided **before**
any of them is built.

**Why it exists.** The readiness review's own finding was that *"the design is
confirmed"* and *"the code matches the design"* are two different sentences,
and that three approved surfaces contradicted their approved design in the
running app. This is the register for the fourth sentence: *what the running
app actually looks like to someone using it.*

---

## 0. The rules this backlog runs under

These are not negotiable and they are the reason the backlog is worth keeping
rather than just fixing things as they are mentioned.

1. **A report is evidence, not an instruction.** A screenshot shows what the
   app does. It does not, on its own, authorise a change to what the app
   should do.

2. **Every issue is compared against the canonical Markdown design documents
   before anything is written.** `ui-ux-design-coverage.md` §5 lists them, and
   `p0-3-system-sign-off.md` wins wherever an earlier document disagrees.

3. **If the approved design clearly settles it → it is a defect and it gets
   fixed**, in a QA batch, with a test.

4. **If the approved design does not settle it → it is a question, and it goes
   to the product owner before any code changes.** Not a guess, not a "sensible
   default", not a quiet improvement.

5. **The artboards in `project/*.dc.html` are illustrative.** A string on an
   artboard that is not in a design document's copy section is artboard drift
   and settles nothing.

6. **Nothing on the permanent rejection list is reopened by a QA report.**
   `implementation-readiness-map.md` §5 holds that list — a confirm on the
   Plan's ✕, a per-kind picker on Empty this trip, a fifth sync colour, a
   spinner anywhere, a guess about why the map is blank, and the rest. If a
   report asks for one of those, the answer is a pointer to §5, not a change.

7. **"It looks wrong to me" is a perfectly good report.** Classifying it is my
   job, not yours. Report it and let the classification happen here.

---

## 1. How to report an issue

Copy this, fill it in, send it. Nothing is compulsory except **Screen** and
**Problem** — I will come back if I need more.

```
Screen:
Problem:
Expected:
Actual:
Screenshot:
Priority:
```

**What to put in each line**

| Field | What helps most |
|---|---|
| **Screen** | Where you were. *"Trip settings"*, *"the Plan in edit mode"*, *"Share, on a trip somebody sent me"*. If you are not sure what a screen is called, describe it — *"the one with the day pills over the map"*. |
| **Problem** | One sentence in your own words. *"The three money boxes don't line up."* |
| **Expected** | What you thought it should do, if you have a view. **Leave it blank if you do not** — if the design settles it, I will find the answer; a guess here can send me the wrong way. |
| **Actual** | What it actually did. Be concrete about anything you can count or read: exact words, how many, which day. |
| **Screenshot** | Very useful for anything visual. See below. |
| **Priority** | Your gut feeling: P0 / P1 / P2 / Nit. It is a starting point, not binding — see §2. |

**Several issues at once:** send them as separate blocks, one after another.
Do not merge two problems into one report even if they are on the same screen;
they usually classify differently.

**Screenshots.** Whole screen rather than a crop, so I can see where the thing
sits. If it is about spacing or alignment, an uncropped screenshot is worth
more than any description. If it is about something that *moves* — a swipe, a
button that flashes, an undo bar that vanishes — a short screen recording is
worth ten screenshots.

**Things worth saying if you know them:** which phone, which browser, whether
the trip was one you made or one somebody shared with you, and whether you
were signed in. Those four facts change what the app is supposed to do, so a
report that includes them can often be classified straight away.

---

## 2. The fields on every issue

### Severity

Set by me on intake, using your priority as the starting point.

| | Meaning | Example |
|---|---|---|
| **P0** | Data loss, a promise broken, or a control that lies. Something the user cannot recover from or is actively misled by. | A delete with no undo; a screen saying a change was saved when it was not. |
| **P1** | The task is completable but the screen is wrong in a way a user would notice and be bothered by. | A row that misaligns; a warning that names the wrong thing. |
| **P2** | Real, correct to fix, but nobody is blocked and most users would not notice. | A hint sentence that reads awkwardly. |
| **Nit** | Cosmetic, arguable, or a matter of taste. Recorded so it is not lost, fixed when something else is being done nearby. | Two pixels of padding. |

### Classification

The important field. It decides who makes the call.

| | Means | Who decides |
|---|---|---|
| **implementation defect** | The design settles it and the code does not do it. | Nobody — it is fixed. |
| **missing implementation** | The design specifies it and it was never built. | Nobody — it is built. |
| **visual mismatch** | It renders differently from the specified treatment: colour, size, spacing, weight. | Nobody, if the design gives values. |
| **interaction mismatch** | It behaves differently: what a tap does, when something appears, what is undoable. | Nobody, if the design gives the behaviour. |
| **copy mismatch** | The words differ from a document's copy section. | Nobody — the copy section wins, verbatim. |
| **design ambiguity** | The design does not settle it, or two documents disagree in a way "the running app wins" cannot resolve. | **The product owner. Blocked until answered.** |
| **documentation inconsistency** | The code is right and a document describes it wrongly. | Nobody — the *document* is corrected, never the code. |

The last one matters more than it looks. This project has already found four
of them, and each time the temptation was to "fix" working code to match a
sentence that was simply wrong.

### Status

`OPEN` → `CLASSIFIED` → (`READY` | `NEEDS DECISION`) → `IN BATCH` → `FIXED` →
`VERIFIED`

- **NEEDS DECISION** — waiting on the product owner. Nothing is written.
- **READY** — the design settles it; queued for a QA batch.
- **VERIFIED** — fixed, deployed, and checked in a browser against the live
  build. Not before.
- **WONTFIX** — with a reason, and a pointer to the decision that settles it.

---

## 3. The register

*(Empty. Issues are appended below as they are reported, newest last, numbered
`QA-1`, `QA-2`, … Do not renumber.)*

<!-- Template for each entry, copy and fill:

### QA-n · <one-line title>

| | |
|---|---|
| **Screen / flow** | |
| **Reported** | <date> |
| **Expected (per approved design)** | |
| **Actually seen** | |
| **Evidence** | |
| **Severity** | P0 / P1 / P2 / Nit |
| **Classification** | |
| **Canonical source** | <document> §<section>, or NONE — see below |
| **Recommended action** | |
| **Status** | |

**Notes.** <Why it classified this way. If the classification is design
ambiguity, the exact question the product owner has to answer, stated so it
can be answered yes/no or A/B.>

-->

---

## 4. How a batch of these gets built

The same loop the implementation milestone ran, unchanged:

**classify → confirm the canonical source → build → test → full regression →
commit → push to `main` → wait for the deploy → confirm both the Hosting and
Firestore-rules steps are green → verify against the deployed build → next.**

Two additions that belong to QA specifically:

- **Everything in one batch shares a classification boundary.** Defects and
  copy mismatches can ship together. Anything classified *design ambiguity*
  never ships in the same batch as anything else, because it is not the same
  kind of change and it needs its own record.

- **Every fix gets a test that would have caught it.** The existing 458-check
  suite did not catch these, by definition — they were found by eye. A QA fix
  without a new assertion is a QA fix that will regress.

---

## 5. Already-answered questions, so they are not re-asked

If a report touches one of these, the answer already exists and the report is
closed with a pointer rather than a change.

| | Answer | Where |
|---|---|---|
| **OD-6** | `Empty this trip` may delete the Shopping List, Packing List and Log. | review §13 |
| **OD-7** | The blank map never guesses why it is blank. | review §13 |
| **OD-8** | Install: Android only, one line, after a second launch. | review §13.2 |
| **OD-9** | One `I'll do this later` ghost on the New-trip modal, and nothing more. | review §13.1 |
| **D-1** | `itemWindow()`'s overnight rule is correct output. A 19h 15m derived length is not a bug. | review §13.3 |
| R-1 · C-1 · S-1 · S-2 · S-3 · S-4 · OD-1 – OD-5 | All closed. | map §5 |

And the standing rejection list — a confirm on the Plan's ✕, a per-kind picker
on `Empty this trip`, a second arrival banner, a stacked undo bar, a fifth
sync colour, a spinner or skeleton anywhere, a guess about why the map is
blank, a sentence making a person the subject of a negative verb, a stock
photo or placeholder person, pagination in Review, a pre-disabled primary —
lives in `implementation-readiness-map.md` §5 and is not reopened here.

---

## 6. Known and already recorded — do not report these as new

These were found during implementation, are written up in the relevant
documents' IMPLEMENTED notes, and are already outstanding. Reporting them
again is harmless but adds nothing.

| | What | Where it is recorded |
|---|---|---|
| 1 | **`Paste a map link` on Destination does not yet complete its fix.** | `p1-absence-and-removal-design.md` IMPLEMENTED note — **under active work as of 6 Sep, see §7** |
| 2 | **`removePerson()` has no owner guard.** Mitigated in the UI by not binding the gesture; the data-layer gap stands. | `p0-1-…` §12.1 and its IMPLEMENTED note |
| 3 | **The card-level `Opening…` state cannot render on a phone with no account.** Correct per P0-5 §6, not a defect. | `p0-5-…` IMPLEMENTED note |
| 4 | Four documentation inconsistencies, already corrected in the documents rather than the code. | the IMPLEMENTED notes on p0-5, p1-destination-tabs, p1-absence, p0-4 |
| 5 | The install line's wording has no canonical source. **Approved as-is by the product owner, 6 Sep 2026.** | this document |

---

## 7. QA-0 · the one carried-over item

Recorded here so the backlog opens with a true picture rather than an empty
one.

### QA-0 · `Paste a map link` did not complete its fix

| | |
|---|---|
| **Screen / flow** | Destination, on a place or stop with no position |
| **Reported** | 5 Sep 2026, by the implementation session itself |
| **Expected (per approved design)** | `p1-absence-and-removal-design.md` §4.2: a `NO POSITION` strip under the two Maps buttons, whose fix button *"opens the facts editor at its map-link field"* — after which the place has a position. |
| **Actually seen** | The strip and the button ship and are correct. The button opened the facts editor, which had **no map-link field**, so pasting a link was impossible and the position could never be fixed from that screen. |
| **Evidence** | `store.PLACE_FACTS` is Opening hours · Phone · Website · Getting in · Worth knowing. Nothing in the app accepted a pasted link for an *existing* place. |
| **Severity** | **P1** — the task was not completable, and a control named a fix it could not deliver, which is the one thing the house rule about warnings forbids. |
| **Classification** | **missing implementation** *(re-classified 6 Sep — it was first recorded as a possible design ambiguity)* |
| **Canonical source** | `p1-absence-and-removal-design.md` §4.2 · `p1-paste-review-design.md` §10 · `p1-destination-tabs-design.md` §9 · `store.js` `importItinerary` header comment |
| **Recommended action** | Give the facts editor its map-link row, bound to the `sourceLink` field every place already carries, resolved through the existing `resolvePlaceInput()`. No new component. |
| **Status** | See the IMPLEMENTED note appended to `p1-absence-and-removal-design.md` for the outcome — implemented in `d76fc82`, 6 Sep 2026. |

**Notes.** It was first reported as possibly needing a product decision. On
re-reading the canonical documents that was wrong, and the correction is worth
recording because it is exactly the discipline this backlog is for: **four
separate approved or shipped strings already promise this capability**, so the
behaviour was settled and only its plumbing was missing.

1. Paste's row editor, on screen today: *"The link is what gives the stop a
   position. Leave it and the stop still saves — it just has no pin until you
   add one from the stop itself."*
2. Paste's done receipt (`p1-paste-review-design.md` §10): *"…they will not
   appear on the map until you open one and paste its map link."*
3. Destination's Info empty state (`p1-destination-tabs-design.md` §9):
   *"Pasting a map link fills in whatever OpenStreetMap has — hours, phone,
   website — and the rest is yours to type."*
4. `store.js`'s own `importItinerary` comment: *"the position, the hours and
   the phone number can be filled in later by opening the stop and pasting its
   map link, one at a time."*

Four promises and no field to keep them. That is a missing implementation, not
an ambiguity, and it needed no decision from the product owner.
