# P0-1 — Role & Copy Identity Design

**Date:** 4 Sep 2026 · **Tree verified against:** `1d3df5956fb8`
**Status:** design, for review. Nothing implemented, no application code changed.
**Artboard:** `P0-1 Role and Copy Identity.dc.html` — 390 × 844, light only.
**Inputs:** `verification-sprint-p0-6.md` §4 (the enforcement finding) · `ui-ux-design-coverage.md` · `existing-ui-visual-reference.md` (the design language, unchanged) · the live source for `share.js`, `screens/share.js`, `screens/parts.js` (`tripChip`, `syncDot`, `who-mark`), `screens/join.js`, `screens/log.js`.

**Out of scope, deliberately:** the diff/conflict model (P0-4) · the currency guess (P0-2) · the pending pattern (P0-5) · the paste gate · D-3 (where the "What they get" card lives) · the sent-state after publishing. Each is noted where it touches this work and left alone.

---

## 1. Product decision (as approved)

1. **Role enforcement stays exactly as it is.** `owner` manages people and roles and publishes; `edit` publishes; `read` receives; **everyone edits their own copy, always.**
2. **The UI must represent that enforcement truthfully.** No dead primary buttons. A `read` user's inability to publish must be legible from the screen. A non-owner must never be handed a role control the model will silently discard.
3. **A joined copy carries a persistent, quiet identity** outside Share and the Log, so the user can tell they are working on their own copy rather than the original trip.

The underlying permission model is not redesigned and no role is removed.

---

## 2. UX principles

1. **The axis is sending, not permission.** Every string about roles describes *whose changes go out*, never what someone is allowed to do to a trip. The invariant — everyone edits their own copy — is stated where the choice is made, not buried in a sub-line.
2. **Enforcement is shown by absence, not by refusal.** Where a capability does not exist, the control does not exist. The app has no error toasts and no permission dialogs; it should not gain either. A missing button plus one explanatory sentence is the house pattern.
3. **Never make a person the subject of a negative verb.** Inherited verbatim from `new-feature-design.md` §2.5. "Ana sends the updates for this trip" — not "you cannot send updates".
4. **Identity is a person, not a connection.** The marker must read as *this copy came from someone*, never as *you are connected to someone*. The app already has a five-state sync indicator; provenance must not look like a sixth.
5. **Identity yields to trouble.** Provenance is secondary. Where it shares space with a sync warning, the warning wins.
6. **No new component.** Everything below is `.who-mark`, `.badge`, `.chip`, `.radio`, `.linkrow`, `.btn` variants, `.hint-jade`, `.eyebrow`, `.moved`/`.arrived` — all already in `app.css`.

---

## 3. Role / capability model

### 3.1 The three roles, and why the offer phase shows two

| Role ID (keep) | Can send updates | Can manage people & roles | Can edit their own copy | Appears in the offer phase |
|---|---|---|---|---|
| `owner` | yes | yes | yes | **no — owner is you, not a grant** |
| `edit` | yes | no | yes | yes |
| `read` | no | no | **yes** | yes |

The offer phase is a choice about **what a link grants**, and a link cannot grant ownership. So it presents two options; the third role appears only as the `OWNER` badge on the manage list. This resolves the "three roles" question without inventing a third radio that could never be chosen.

### 3.2 Terminology assessment

Assessed against the product model: *"Everyone edits their own copy. Some people can send their changes to everyone else."*

| Current string | Where | Verdict |
|---|---|---|
| `owner` / "Owner" / `OWNER` | role id, label, badge | **Keep.** Reads as identity, not as a permission level, which is correct. |
| "Sends updates, invites people, and deletes the trip" | `ROLES.owner.can` | **Change.** Deleting a trip is not on Trip settings at all (verified — it is `Empty this trip`, and deletion is a swipe on My trips), so this string points at a capability the user cannot find where it implies. |
| `edit` (role id) | internal | **Keep as an id, never surface it.** "Edit" is the one word that must not appear: everyone edits. |
| "Can send updates" | `ROLES.edit.label` | **Keep.** Accurate and on the right axis. |
| "Can send their changes to everyone else on the trip" | `ROLES.edit.can` | **Keep.** |
| `read` (role id) | internal | **Keep as an id, never surface it.** "Read" implies read-only, which is false. |
| "Receives updates" | `ROLES.read.label` | **Keep.** Neutral, on the right axis, does not imply read-only. |
| "Gets updates and can do whatever they like to their own copy" | `ROLES.read.can` | **Keep — it is the best string in the set.** It is the only place the invariant is currently stated. |
| **"Send updates"** | offer-phase radio, produced by `label.replace('Can ', '')` | **Change — this is the real inconsistency.** Stripping "Can " leaves an imperative ("Send updates") paired against a third-person ("Receives updates"). Non-parallel, and it reads as an instruction to the reader rather than a description of the invitee. Show the labels unmodified. |
| **"They will be able to"** | offer-phase eyebrow | **Change.** Frames the choice as permissions — the exact misreading to prevent. |

**Conclusion: the labels are sound; the framing around them is not.** Three copy changes (the eyebrow, the un-stripped radio labels, the owner `can` string) plus one added invariant line fix the inconsistency without renaming anything or touching a role id.

### 3.3 Final user-facing wording

| Slot | Final wording |
|---|---|
| Offer eyebrow | `SENDING UPDATES` |
| Offer invariant line (11px `--soft`, above the card) | "Everyone who joins gets their own copy and can change it however they like. This only decides whose changes go out to everyone else." |
| Offer option A | **Can send updates** — "Their changes go out to everyone on the trip." |
| Offer option B | **Receives updates** — "They get your updates, and change their own copy however they like." |
| Offer footnote (existing) | "You can change this per person afterwards." — keep |
| Owner badge | `OWNER` — keep |
| Owner capability line | "Sends updates, and looks after who is on the trip." |
| Manage role control, owner's view | `Can send updates` / `Receives updates` + caret |
| Manage role display, non-owner's view | `CAN SEND UPDATES` / `RECEIVES UPDATES` as a `.badge` |
| Your own row, any view | existing `.mine-chip` reading `YOU` |
| Non-owner manage explainer | "Ana looks after who is on this trip and sends its updates." |
| `read` user's send block | eyebrow `YOUR CHANGES`; body "Everything you change stays on your copy. Ana sends the updates for this trip." |
| Joined-copy marker | `from Ana` (with a `.who-mark`) |
| Arrival banner, `read` | "This copy is yours. Change anything you like — it stays on this phone." |
| Arrival banner, `edit` | "This copy is yours. When you want everyone else to have your changes, send an update from Share." |
| Log line (corrected) | "The Log is not part of a shared trip. Nothing here is sent to anyone on this trip, and no update can reach it." |

---

## 4. Share states

### 4.1 Offer phase (before a link exists)

Unchanged structurally. Three edits: the eyebrow becomes `SENDING UPDATES`; the invariant line is added above the two `.linkrow` radios; the radio labels are shown unmodified so both read in the third person. Expiry chips, the jade explainer and the `.who-mark` owner row are untouched.

**Why the invariant line and not a longer sub-line:** the misreading happens in the first second, from the two labels alone. A line above both is read before either; a line inside one is read after the damage.

### 4.2 Manage phase — owner

Rows keep their shape (`.who-mark` + name + "Joined 1 Sept"). One change: **the role chip gains `icon.caret`**, so a control looks like a control. Tapping still expands the existing `.pick-chip` row — no new interaction. `+ Add someone`, the swipe-to-remove hint and the link section stay.

Your own row gains the existing `.mine-chip` `YOU`, which the screen does not currently show.

### 4.3 Manage phase — non-owner

This view does not exist today; the screen renders the owner's controls to everyone.

| Element | Owner | Non-owner |
|---|---|---|
| People list | rows with tappable role chips | rows with **`.badge`** role displays — flat, uppercase, not tappable, no caret |
| Own row | `.mine-chip` `YOU` | `.mine-chip` `YOU` |
| `+ Add someone` | shown | **hidden** |
| Swipe a person to remove | available | **not available** |
| "The link" section (live toggle, expiry, revoke) | shown | **hidden** — a joined copy has `sharedFrom`, not `link`, so every control in it is already inert |
| Explainer | swipe hint | jade `.hint-jade`: "Ana looks after who is on this trip and sends its updates." |

**The chip-versus-badge decision.** The role display becomes a **`.chip` + caret for the owner** and a **`.badge` for everyone else**. This is the existing vocabulary doing exactly its documented job: `.badge` is the provenance family (`MAIN`/`SUB`/`OWNER`) — flat, uppercase, never interactive — and `.chip` is inline metadata that here becomes explicitly interactive by gaining the caret the app already uses for "this opens something". Nothing is invented, and the difference is legible without reading: a caret means you can change it.

### 4.4 Send an update

| State | Treatment |
|---|---|
| **owner / `edit`, changes waiting** | jade `Send *n* changes` — unchanged. The surrounding copy in `share.js` `sending()` is **not re-specified by this design**; the artboard shows the button only and says so. |
| **owner / `edit`, nothing to send** | existing line "They have everything you have sent" + ghost disabled `Nothing to send` — unchanged |
| **`read`, whether or not they have changed anything** | **The button is not rendered.** In its place, a jade `.hint-jade` block: eyebrow `YOUR CHANGES`, body "Everything you change stays on your copy. Ana sends the updates for this trip." **And nothing else** — no sentence names the absent button. Naming the absence would re-introduce the refusal in words, which is exactly what principle 2 exists to prevent. |
| **just sent** | the block returns to its "nothing to send" shape. This is a weak confirmation and it is **left as-is**: a proper sent state belongs to the send-update decision, not to P0-1. Recorded in §12. |
| **pending / in-progress** | **not applicable, verified.** `publishUpdate()` is synchronous and the network write is fire-and-forget (`pushPublished().catch()`), so there is no interval during which a pending state could be true. No spinner is designed, and none should be added. |

**Why the button disappears rather than going disabled.** A disabled control still asserts that the action is yours and merely unavailable right now — which is what a disabled `Nothing to send` correctly means for an owner with no changes. For a `read` user the action is not theirs at all, and a permanently disabled primary button would be a standing accusation with no fix. Removing it and naming who does send matches principle 2 and the house rule that a warning always names the tap that fixes it — here there is no such tap, so it is not a warning.

---

## 5. Joined-copy identity — alternatives

Two facts from the source constrain this and eliminate one option outright:

- `tripChip()` renders `trip.code` in `.trip-mark` — that slot is the **trip's** identity and is not available.
- `.trip-meta` is **overwritten** whenever sync is `queued` or `stuck` (`words || 'Day n of m · date'`). Anything placed on that line shares it with sync status.
- The trip chip lives only on `.map-top`. **No element names the trip on all five tabs**, so "persistent" can only mean "everywhere the trip already identifies itself" — unless a new bar is invented, which is out of scope.

### Alternative 1 — "from Ana" as text in the trip-chip meta line

- **Communicates:** whose copy this is, in words, where the trip is named.
- **Appears:** Map only.
- **Does NOT communicate:** role, sync state, whether anything is shared outward.
- **CJK:** works, but the name is set at 10.5–11.5px, near the floor for legibility of Han glyphs.
- **Long names:** needs truncation on a single line; a long name pushes out the day/date it shares the line with.
- **Confusion risk:** **high.** It sits on the same line the sync warning takes over, two elements away from the sync dot. Provenance rendered inches from a five-state connection indicator invites reading as a sixth state.
- **Owner vs joined:** owner sees the ordinary day/date line; absence is the only signal.

### Alternative 2 — a `SHARED COPY` or `FROM ANA` `.badge` on the My trips card

- **Communicates:** at a glance, that this card is not an original.
- **Appears:** My trips only.
- **Does NOT communicate:** who it came from (in the `SHARED COPY` wording), or role.
- **CJK:** **fails.** `.badge` is 9.5px/800 uppercase; uppercasing does nothing to Han, and 9.5px Han is not legible. A name-bearing badge is script-dependent by construction.
- **Long names:** fails — a badge is a fixed short token.
- **Confusion risk:** **high on the wording.** "SHARED COPY" is one word away from implying live sharing, the single misreading the product exists to prevent.
- **Owner vs joined:** clean asymmetry, but only on one screen.

### Alternative 3 — a `.who-mark` + "from Ana", wherever the trip already identifies itself ✅

- **Communicates:** this copy came from a person, and which person — carried by a mark that is *already* the app's representation of a human (`.acct` row, `join-from`, Share people rows, and the tier-3 empty state in `new-feature-design.md`).
- **Appears:** the My trips card (mark + "from Ana" in the meta line) · the Map trip chip (14px mark + "from Ana" in the meta line, yielding to sync warnings) · the Trip settings push-sub · Share · Join · the Review header (already present as "Ana sent an update").
- **Does NOT communicate:** role, sync state, live-ness, or that anything travels outward. All correct — those are other jobs.
- **CJK:** **verified working.** `initialFor()` deliberately takes the surname character for Han and kana rather than transliterating, and 陳 rendered correctly in the manage frame captured during the sprint.
- **Long names:** immune. The mark is one glyph; the adjoining "from Ana" text truncates on the meta line, and the mark survives truncation.
- **Confusion risk:** **lowest of the three.** It is visually a person, not a state: a filled circle with a glyph, distinct from the 26px trip code mark and from the 6px sync dot. Residual risk that a face-like mark implies presence, mitigated by the word "from", which is past tense in effect.
- **Owner vs joined:** an owner's own trip never carries a who-mark. Joined copies always do, on every surface that names the trip.

### Recommendation

**Alternative 3.** It is the only one that is script- and length-proof, the only one that reads as a person rather than a connection, and it reuses a component already proven with a Han name in a captured frame. It also degrades honestly: on a joined copy with a stuck outbox, the sync warning takes the meta line and provenance disappears for the duration — which is the right priority and is accepted behaviour, not a defect (principle 5).

**Accepted limitation, stated plainly:** this is not a marker on all five tabs, because no such surface exists. It appears wherever the trip is already named. Making it truly omnipresent would require a new persistent element, which this design deliberately does not add.

---

## 6. Affected screens

| Screen | Change | Kind |
|---|---|---|
| Share — offer | eyebrow, invariant line, un-stripped radio labels | copy |
| Share — manage (owner) | caret on the role chip; `YOU` on your own row | visual + interaction |
| Share — manage (non-owner) | **new view**: badges not chips; no add, no swipe, no link section; one jade explainer | interaction + copy |
| Share — send block (`read`) | button removed; jade explainer in its place | interaction + copy |
| Share — send block (owner / `edit`) | **no change.** The button and its surrounding copy stay as they are | — |
| My trips — trip card | `.who-mark` + "from Ana" in the meta line, joined copies only | visual |
| Map — trip chip | 14px `.who-mark` + "from Ana" in the meta line, yielding to sync warnings | visual |
| Trip settings — push sub | `.who-mark` beside the trip name | visual |
| Join — after joining | one-time `.arrived` banner on arrival, branched by role | copy |
| Review | **no change.** The header already reads "Ana sent an update", so identity is attributed. Whether the side keys become `ANA'S` instead of `THEIRS` is a diff-model question and belongs to P0-4 | — |
| Log | one copy correction (see §7); the screen-level line is **kept**, not removed | copy |
| `share.js` `ROLES.owner.can` | corrected string | copy |

---

## 7. Exact copy

**Share — offer**
> `SENDING UPDATES`
> Everyone who joins gets their own copy and can change it however they like. This only decides whose changes go out to everyone else.
> ● **Can send updates** — Their changes go out to everyone on the trip.
> ○ **Receives updates** — They get your updates, and change their own copy however they like.
> You can change this per person afterwards.

**Share — manage, non-owner**
> Ana looks after who is on this trip and sends its updates.

**Share — send block, `read` user**
> `YOUR CHANGES`
> Everything you change stays on your copy. Ana sends the updates for this trip.

**Owner capability line** (replacing the "deletes the trip" string)
> Sends updates, and looks after who is on the trip.

**Joined-copy marker**
> `from Ana` — and where two names are involved, `from Ana` still (the marker names the owner, never a list).

**Join — arrival, `read`**
> `YOUR COPY`
> This copy is yours. Change anything you like — it stays on this phone.

**Join — arrival, `edit`**
> `YOUR COPY`
> This copy is yours. When you want everyone else to have your changes, send an update from Share.

**Log — corrected**
> The Log is not part of a shared trip. Nothing here is sent to anyone on this trip, and no update can reach it.

*(The current string is "Nothing here is sent to Ana, and no update **they** send can reach it" — a singular name against a plural pronoun, and it needs the owner's gender to read correctly. The replacement is gender-free and works for one traveller or five.)*

---

## 8. Visual treatment

Nothing new. Values are literal from `app.css`.

| Element | Treatment |
|---|---|
| Invariant line | 11px / 400 / `--soft` `#98A5A0`, line-height 1.45, above the `.card-list`, 16px sides |
| Offer radios | unchanged `.linkrow` + `.radio` (16px, jade with a 3px inset white ring when on) |
| Role control, owner | `.chip` r8 10.5px/650 on `--bone`, plus `icon.caret` at 10px in `--soft`, 4px gap |
| Role display, non-owner | `.badge` r6 9.5px/800 `.04em` uppercase, `--bone` fill, `--muted` text — same family as `OWNER` |
| Your own row | existing `.mine-chip` |
| `read` send block | `.hint-jade` — `--jade-bg` `#E6EFEB`, 1px `--jade-bd` `#CFE0D9`, r16, 14px pad; eyebrow `.eyebrow.jade`; body 12.5px/1.5 `--jade-fg` `#5D8C7C` |
| Non-owner explainer | same `.hint-jade` |
| `.who-mark`, My trips card | 18px, existing `.who-mark` styling, inline before "from Ana" in the card meta row |
| `.who-mark`, trip chip | 14px, inline at the start of `.trip-meta` |
| "from Ana" text | inherits `.trip-meta` / card meta: 10.5–11.5px / 650 / `--soft`; `text-overflow: ellipsis` on the name |
| Arrival banner | existing `.arrived` class (defined in `app.css`, currently unused by any screen) — jade surface, dismissible, same geometry as `.moved` |

**Colour semantics held.** Jade throughout, because every one of these states is *the given side*: a copy you were handed, an update someone else sends, a person who looks after the trip. Amber would make provenance a warning; rust would make it broken. Neither is true. This follows the tier-3 reasoning in `new-feature-design.md` §2.3 exactly.

---

## 9. Interaction behaviour

1. **Role change (owner).** Tap the role chip → the existing `.pick-chip` row expands beneath the person. Pick → the row collapses, the chip updates. Unchanged behaviour; the caret is the only addition.
2. **Role display (non-owner).** Not focusable, not tappable, no hit target. The dead interaction is removed rather than intercepted — nothing to tap means nothing to explain.
3. **Send (owner / `edit`).** Unchanged.
4. **Send (`read`).** No control exists. Nothing is disabled, so nothing invites a tap.
5. **Swipe to remove a person.** Owner only. `swipeToDelete` is not bound on a non-owner's rows. *(Note: `removePerson()` currently guards only against removing the owner, not against a non-owner calling it — see §12.)*
6. **Arrival banner.** Shown once on the first Plan or Map paint after `joinTrip()` resolves; dismissed by the existing `.arrived` dismiss affordance, and does not return. It is not a blocking interaction — the app has only two, and this is not one of them.
7. **The marker is never interactive.** It is provenance, not navigation. Tapping the trip chip continues to open My trips, exactly as now.

---

## 10. CJK and long-name behaviour

| Case | Behaviour |
|---|---|
| Han / kana owner name | `.who-mark` shows the surname character via `initialFor()` — verified with 陳美玲 → 陳 in a captured frame. No transliteration, no romanisation. |
| Long Latin name ("Alexandra Fitzgerald-Moreau") | The mark is unaffected. "from Alexandra Fitzgerald-Moreau" truncates with an ellipsis on the meta line; the mark and the word "from" always survive. |
| Long CJK name | Same truncation path; the mark is one glyph and always legible. |
| Name of one character ("李") | `.who-mark` shows 李; the text line reads "from 李". No minimum-length assumption anywhere. |
| Empty / missing owner name | `initialFor()` returns `?`; the text falls back to "from the owner", which `join.js` already uses as its default. |
| Role labels in a narrow column | "Can send updates" is the longest at 10.5px/650 — it fits the existing chip width on the captured manage frame. As a non-owner `.badge` it uppercases to `CAN SEND UPDATES`; at 9.5px/800 with `.04em` this is the tightest fit in the design and should be checked against a 390px frame before implementation. |

---

## 11. Accessibility and state considerations

1. **The removed control is the accessibility win.** A `read` user currently reaches an enabled `<button>` that a screen reader announces as actionable and that does nothing. Removing it removes the lie; the jade block carries the same information as text.
2. **`.badge` versus `.chip` is not carried by colour.** The difference is the caret and the type treatment (9.5px/800 uppercase versus 10.5px/650 sentence case), so it survives greyscale and does not depend on distinguishing bone fills.
3. **Focus.** The app has no visible focus ring on any control (audit §12.10) and this design does not change that — but it also does not add a new unfocusable control: the non-owner badge is a `<span>`, not a `<button>`, so it is correctly skipped by keyboard navigation rather than being a focusable no-op.
4. **`aria-label` on the marker.** The `.who-mark` is decorative beside the adjacent "from Ana" text and should be `aria-hidden`, so the name is announced once, not twice. The existing `syncDot()` already sets `aria-label` per state; provenance must not add a second announcement to the same chip.
5. **The marker yields to sync warnings**, so on a joined copy with a queued or stuck outbox the identity line is temporarily replaced. Accepted (principle 5); the identity remains on My trips and Trip settings throughout.
6. **The arrival banner is not the only place the concept lives.** If it is dismissed or missed, the marker and the Share explainer still carry it. Nothing depends on a one-time message being read.

---

## 12. Open questions

1. **`removePerson()` has no owner guard** — it only refuses to remove the `owner` role. A non-owner can therefore remove people from their own copy's people list; it changes nothing for anyone else but silently corrupts their local view of who is on the trip. Found while designing this; **recorded, not fixed.** The design simply does not bind the gesture for non-owners, which is a UI-level mitigation of a data-layer gap.
2. **What the sender sees after sending** is still unresolved and still belongs to the send-update decision, not here. This design leaves the post-send state exactly as it is.
3. **`CAN SEND UPDATES` as a 9.5px/800 uppercase badge** is the tightest type fit introduced. Needs a look at 390px before implementation.
4. **Does the `edit` arrival copy send people to the right place?** It names Share as where an update is sent from, which is correct today (Trip settings → Share). If sending ever moves, this string moves with it.
5. **Should the Review side keys become `ANA'S` / `MINE`?** Deliberately unresolved — it is a diff-model question for P0-4. Flagged so it is not lost.
6. **D-3 — CLOSED, 5 Sep 2026,** in `p1-share-join-review-flow-design.md` §3.1: the "What they get" card moves to the offer phase, above the role radios, and the separate jade explainer merges into it. That document also adds the non-owner Share view's missing gate (a joined copy renders the *offer* phase today, because `share` is null — IF-6), the link-role control (F-3) and the post-send state left open in §12.2 here. Nothing in this document changed. Original note follows.
   **D-3 was untouched:** the three-bullet "What they get" card still appears only after a link exists. It would sit naturally beside the new invariant line, but moving it is a separate decision.
