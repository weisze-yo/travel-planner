# P1 — The account: signing in, coming back, signing out

**Date:** 5 Sep 2026 · **Verified against** the working tree in this project (`web/**`), read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** none. Every state here is a variant of one existing panel and one existing row; a frame set would be six near-identical crops. The two states worth seeing are already captured (`screens/current/01`, `02`). Stated so the omission is a decision, not an oversight.
**Canonical:** this document. §8 is the only source of copy.

**Source read this session:** `web/js/screens/parts.js` `signInPanel` (659) / `mountSignIn` (703) · `web/js/screens/trips.js` `accountRow` (~180), the `signingIn` modal, `sign-out`, `sign-open`, `sign-close` · `web/js/store.js` `signIn` (3174) · `landOn` (3202) · `signInProblem` (3235) · `signOut` (3250) · `awaitingEmail` / `cancelEmailSignIn` / `noteSignIn` (3268–3272) · `resolveAccount` / `restoreAccount` · `web/js/persist.js` `restoreAccount` (~226–252) · `sendSignInEmail` (~320) · `completeEmailLink` (346) · `signInWithGoogle` (~264) · `pendingEmail` / `forgetPendingEmail` · `web/js/screens/join.js` (the sign-in phase) · `web/css/app.css` `.acct` (2173–2186) · `.sign-btn` (2057–2072) · `.amber-note` (925) · `.who-mark` (1967).

**Fixed foundations, not reopened:** **P0-5** (pending belongs to the control; `.amber-note` for outcomes, errors, refusals and payloads; no spinner; work the user did not start gets no indicator) · **P0-1** (the `.who-mark` is the app's representation of a person; never make a person the subject of a negative verb) · the app's standing rule that **nothing is ever demanded** — sign-in is offered, states what it buys, and everything works signed out · no new component families · 390 × 844.

**Out of scope, deliberately:** the join flow's own sign-in phase framing (`p1-share-join-review-flow-design.md` §4.10 — where the arrival banner lands) · what a signed-in account can do that a local one cannot, which is the whole of the sharing model and is designed elsewhere · Apple sign-in, which is deliberately absent and whose reason is already in the panel's copy.

---

## 1. What is built, and what it costs

**The panel is one of the better-designed things in the app** and is not redesigned. `signInPanel()` is one shared component used in exactly two places — the trips home modal and the join flow — with two ways in and no password anywhere. Its own copy explains why there is no password and why Apple is missing. `landOn()` keeps the identity id untouched, which *is* the local→account migration, so the sheet's promise ("every trip you have made comes with you") is literally true.

Read end to end, **four things are wrong and one of them is a whole state that renders nowhere.**

| # | Break | Source |
|---|---|---|
| **G-1** | **The email return leg is unannounced.** `restoreAccount()` completes the emailed link during boot and sets `notice = 'email'` (or `'redirect'`, or an error code). It is returned, stored on `state.session`, and **read by nothing**. The user taps a link in their mail, the app opens, they are signed in — and no screen says so. The one flow whose whole point is that it finishes on a later launch is the one flow with no arrival. | `persist.js` 236–252; `state.session` set in `store.js` ~129; grepped — no reader |
| **G-2** | **Pending is in the note, not on the button.** `mountSignIn` writes `Opening Google…` / `Sending a link to {email}…` into `state.signInNotice`, which renders as an `.amber-note` **above** the two buttons. Both are multi-second: one opens a popup, the other posts to Firebase. P0-5 R1 puts pending on the control, and R4 empties this slot of pending text entirely. | `parts.js` 715, 661 |
| **G-3** | **`Signing out…` is at the top of a scroller and the row that caused it is below.** Same shape, and sign-out is `await signOutAccount()` plus a full `boot()` — the third of the app's multi-second waits. | `trips.js` `sign-out` |
| **G-4** | **A sign-in failure and a sign-in *state* share one slot.** `signInNotice` carries `Opening Google…`, `That does not look like an email address.`, and seven real Firebase failures — pending, refusal and error in one variable, in one amber box. | `store.js` 3235; `parts.js` 712 |

Plus one thing that is right and is easy to break: **`{ ok: false, sent: true }`.** An emailed sign-in is not a failure and not a success — it is *sent*, and the panel already switches to its own `CHECK YOUR MAIL` view off `awaitingEmail()`. Nothing in this design collapses those three answers into two.

---

## 2. The rule this adds

> **A sign-in that finishes on a later launch must say so on that launch, in the place the account lives.**

That is G-1, and it is the only new rule here. Everything else is P0-5 applied to three controls.

The corollary, which is what keeps it from becoming a toast system: **the account row is where the account speaks.** Not a banner, not an overlay, not a strip. The row already states who this phone is; a return leg changes that answer, so the row is where the change is legible.

---

## 3. The account row — four states

`.acct` is white, r14, 1px `--line`, above the trips list: `.acct-name` 12.5px/700 `--ink`, `.acct-sub` 11px/1.4 `--soft` mt2, a `flex: none` control on the right, and a `flex: none` 30px `.who-mark` on the left when signed in.

| State | Mark | Name | Sub | Control |
|---|---|---|---|---|
| **Signed out** *(existing)* | — | `Everything is on this phone` | Sign in and your trips follow you to a new one — and a shared link can reach it. | ink `Sign in` |
| **Signed in** *(existing)* | `.who-mark` initial | the name | the email, or `Google account` | ghost `Sign out` |
| **Just arrived by link** ← new | `.who-mark` initial | the name | `Signed in just now — every trip on this phone is in this account.` | ghost `Sign out` |
| **Signing out** ← new | initial, unchanged | the name, unchanged | unchanged | ghost `Signing out…` **[disabled]** |

**The third state is G-1's whole fix**, and it is one substituted sub-line on a row that is already rendering. It shows once, on the launch that completed the link, and is replaced by the ordinary sub on the next paint after the user does anything. No dismiss control: it is not a message, it is the row telling the truth about a change that just happened.

**Why not a jade `.arrived`-style banner.** The app has one arrival banner and it belongs to joining a trip (P0-1 §7). A second one, for an account, on a different screen, would make "arrival" a pattern rather than a fact about a shared copy — and the account row is *right there*, is already about this, and needs no new element.

**Why the sub-line and not the name.** `landOn()` may not have a name to show: it falls back through the typed name, the previous name, the Google name, the email local-part, then `'You'`. A row reading `You` / `Signed in just now` is honest; a row that announced the arrival in the name slot would have nowhere to put a missing name.

**The three return legs, and what each says.** `restoreAccount()`'s `notice` has three shapes, and they are not the same event:

| `notice` | What happened | Row sub |
|---|---|---|
| `'email'` | the emailed link completed on this launch | `Signed in just now — every trip on this phone is in this account.` |
| `'redirect'` | a Google popup was refused, so the redirect leg came back | the same line — from the user's side it is the same event |
| an error code | the link was already used, or expired | **not the row.** It is a failure of an action the user started, so it goes where failures go — §5 |

---

## 4. Pending, on the three controls

P0-5 R1/R2, and nothing else changes.

| Control | Today | Designed |
|---|---|---|
| `Continue with Google` (`.sign-btn`, h48) | enabled; `Opening Google…` in an `.amber-note` above | label → `Opening Google…`, `[disabled]`, `aria-busy` |
| `Send me a link` (`.sign-btn`, h48) | enabled; `Sending a link to you@example.com…` above | label → `Sending the link…`, `[disabled]`, `aria-busy` |
| `Sign out` (`.btn.sm.ghost`) | enabled; `Signing out…` at the top of the trips scroller | label → `Signing out…`, `[disabled]` |

**`Sending the link…` drops the address**, per P0-5 §6: a pending label never interpolates user data, and the address is in the field two rows up. This is the fifth de-interpolated label and it is added to P0-5's list rather than being a local exception.

**The two `.sign-btn`s are one family (P0-5 R11):** while either is pending the other goes `pointer-events: none` **without fading**, because two sign-ins cannot both win. The `Not now` ghost below them stays live — leaving is always allowed, and the work continues.

**`Sign out` disables nothing else.** It is not a navigating action in the R11 sense; `boot()` re-renders the whole screen when it lands.

**No pending on `Use a different address`.** `cancelEmailSignIn()` is synchronous (`forgetPendingEmail` + `notify`) — P0-5 R10, and it is exactly the kind of control someone would "complete the set" on.

---

## 5. Failures, refusals and the one slot they share

**G-4's fix is a split, not a new element.** `.amber-note` keeps the panel's failures; the difference is that it stops carrying pending text, so what is left in it is one kind of thing.

| Kind | Example | Where |
|---|---|---|
| **Refusal** — the input is not usable | `That does not look like an email address.` | the **email field's own hint**, in rust, like `trip.js`'s field warnings — it is about that field, and putting it in a box above two buttons makes the reader look for what it refers to |
| **Failure** — the attempt was made and did not land | `That window closed before it finished. Try again?` · `Signing in needs signal, once. Everything else works without it.` · `That link has already been used, or it has expired. Ask for a new one.` | the existing `.amber-note`, above the buttons, unchanged |
| **Misconfiguration** — the project, not the user | `This address is not on the project's allowed list yet — see step 4 of the guide.` · `That way of signing in is not switched on in the Firebase console yet.` | the same `.amber-note`. **Unchanged, and deliberately not softened**: these are for whoever is deploying the app, and they name the fix |
| **Unknown** | `signInProblem`'s fallback: the raw message, or `That did not work.` | the same `.amber-note` |

All seven strings are **existing and unchanged**. The only change is that one of them — the email refusal — moves to the field it is about, and the box stops sharing with pending.

**The return-leg failure (§3) lands in the same `.amber-note`**, and it needs the sheet to be open to be seen. So: **when a boot-time `notice` is an error code and the user is not signed in, the trips home opens the sign-in sheet with that note in it.** One line of routing, no new screen, and it is the only case in this document where the app opens something on its own — justified because the user's last deliberate act was tapping a link *for this purpose*, and the app is answering it.

`auth/invalid-action-code` is the string that case shows, and it already names the fix (`Ask for a new one.`).

---

## 6. `CHECK YOUR MAIL`, and coming back

**Verified and unchanged in shape.** `awaitingEmail()` returns the address `sendSignInEmail` stored on this phone, and while it is set the panel *replaces itself*: `.eyebrow.jade` `CHECK YOUR MAIL`, `A link is on its way to ana@example.com.` at 14px/800, then the two-sentence explanation (opens on this phone, works once, expires), then ghost `Use a different address`.

Three states around it, all specified, none new to the app:

| Journey | Behaviour |
|---|---|
| Close the sheet and come back | `awaitingEmail()` is on the phone, not in module state, so the panel is still `CHECK YOUR MAIL`. **Existing, and it is right** — the pending thing is a real pending thing, not a screen state. |
| Relaunch the app | Same. This is the only pending state in the product that survives a relaunch, because the work is happening in someone's inbox. |
| Open the link on a **different** device | `completeEmailLink` finds no `pendingEmail()` and calls `window.prompt('Which email address was this link sent to?')`. **Recorded as IF-20, not designed:** it is the app's only `window.prompt`, it is browser chrome the design cannot style, and replacing it needs a screen that does not exist. It is also correct behaviour — the alternative is failing silently. |
| The address was wrong | `Use a different address` → `cancelEmailSignIn()` → the panel returns to its two-way form. No confirmation: nothing is lost but a mail nobody will open. |

**One addition, because the sheet makes a promise it does not repeat.** The trips modal's sub says the sample trip stays behind; `CHECK YOUR MAIL` replaces that sub entirely, so a user who reads only the second screen never learns it. The existing explanation gains one clause:

> `Open it on this phone and you are in — nothing to type and nothing to remember. It works once, and it expires. Everything already on this phone comes with you.`

That last sentence is `landOn()`'s actual behaviour, stated where the wait is.

---

## 7. Self-audit at 390 × 844

| Case | Behaviour |
|---|---|
| **Long name** (`Alexandra Fitzgerald-Moreau`) | `.acct-name` is 12.5px/700 in the row's `grow` column; it wraps to two lines and the row grows. The `.who-mark` and the control are both `flex: none` (verified in `app.css` 2185–2186) so neither is squeezed. |
| **CJK name** (`陳美玲`) | `.who-mark` shows 陳 via `initialFor()`. The row line is 12.5px Han — above the floor for a name the user typed themselves, and it is not a needle in a haystack (P0-2 §11's knowing-exception rule). |
| **Long email** (`alexandra.fitzgerald-moreau@some-university.ac.uk`) | `.acct-sub` is 11px and wraps. Designed: it takes `overflow-wrap: anywhere` so a single long token cannot push the `Sign out` button off the row. **This is the one CSS addition in this document** and it is one property. |
| **No name at all** | `landOn()`'s ladder ends at `'You'`. Row reads `You` / the email. Every sentence in §8 is grammatical with it. |
| **Signed in with Google, no email exposed** | `.acct-sub` falls back to `Google account` — existing, unchanged. |
| **Empty state** | The signed-out row *is* the empty state for this component, and the trips list below has its own (tier 1, `new-feature-design` 1A). Two empty states on one screen, and they are about different things — who this phone is, and what is on it. |
| **Loading** | §4 — three labels, all on their controls. Boot's own account read gets **nothing** (P0-5 R5: the user did not start it). |
| **Error** | §5 — seven existing strings, one moved to a field hint, one routed to an auto-opened sheet. |
| **Navigation away and back** | `signingIn` is module state and dies; `awaitingEmail()` is on the phone and survives (§6). `signInNotice` is **store** state and survives a screen change — designed: `sign-close` already clears it (`store.noteSignIn('')`), which is correct and must stay. |
| **Destructive actions** | None. **`Sign out` is not destructive** and must not be treated as one: the identity id survives, the trips stay where they are, and signing back in is the same person. Its own source comment says so. No confirmation, no undo, no warning. |
| **Undo** | None, and none needed. |
| **Focus** | Two `.sign-btn`s and two inputs. `input:focus` gets a jade border already; the buttons have no visible focus, which is the app-wide position (audit §12.10) and is not changed here. |
| **Accessibility** | `aria-busy` on whichever `.sign-btn` is pending. The `.who-mark` is decorative beside the name and should be `aria-hidden` (P0-1 §11.4). The `CHECK YOUR MAIL` swap replaces the panel's content, so a screen reader lands on a heading that states the new state — which is the correct behaviour and needs nothing added. |

---

## 8. Exact copy

**Canonical.**

**Account row** *(the first two existing and unchanged)*
> `Everything is on this phone` · Sign in and your trips follow you to a new one — and a shared link can reach it. · `Sign in`
> `Ana Lim` · `ana@example.com` / `Google account` · `Sign out`
> Signed in just now — every trip on this phone is in this account. **(new)**
> `Signing out…` **(existing string, new placement — on the button)**

**The sheet** *(all existing, unchanged)*
> `Sign in` · So this stops being one phone's trip. Every trip you have made comes with you, under the same name and the same links. The sample trip does not — it stays here, for whenever nobody is signed in.
> `Who are you?` *(the join flow's title)*
> `The name other travellers see` · `Ana Lim`
> `Continue with Google`
> `Or a link to my email` · `you@example.com` · `Send me a link`
> There is no password. The link in the mail is the sign-in, and it only works once. Apple sign-in needs a paid Apple Developer account, so it is not offered.
> `Not now`

**Pending** *(existing strings except where marked)*
> `Opening Google…`
> `Sending the link…` **(de-interpolated — was `Sending a link to {email}…`)**

**Waiting for the mail** *(existing, plus one sentence)*
> `CHECK YOUR MAIL`
> A link is on its way to ana@example.com.
> Open it on this phone and you are in — nothing to type and nothing to remember. It works once, and it expires. Everything already on this phone comes with you. **(one sentence added)**
> `Use a different address`

**Refusals and failures** *(all existing, unchanged; only the first one moves)*
> That does not look like an email address. **(moves to the email field's hint, rust)**
> That window closed before it finished. Try again?
> Signing in needs signal, once. Everything else works without it.
> That link has already been used, or it has expired. Ask for a new one.
> This address is not on the project's allowed list yet — see step 4 of the guide.
> That way of signing in is not switched on in the Firebase console yet.
> That did not work.

---

## 9. What an implementer needs

1. **`state.session.notice` gets a reader.** `trips.js` `accountRow()` substitutes the "just now" sub when it is `'email'` or `'redirect'` and an account is present; the flag is consumed on first render so the line shows once. **This is G-1 and it is the only new state in this document.**
2. **When the boot notice is an error code and nobody is signed in**, the trips home opens the sign-in sheet with that string in `signInNotice`.
3. **`mountSignIn` stops writing pending into `signInNotice`** and sets a pending key naming which provider is in flight; the two `.sign-btn`s take the label swap, `[disabled]`, `aria-busy`, and `pointer-events: none` on the sibling.
4. **The email refusal moves to the field**, as a rust hint, not into the note.
5. **`sign-out` moves its pending onto the button.** The `busy` slot in `trips.js` keeps its other four jobs (P0-5 §3).
6. **One sentence added** to `CHECK YOUR MAIL`; one sub-line added to the account row.
7. **New CSS: one property** — `overflow-wrap: anywhere` on `.acct-sub`.
8. **Do not touch:** `landOn()`'s name ladder, the identity-preserving migration, `awaitingEmail()`'s survival across launches, the `{ ok, sent, redirecting }` three-way answer, or the seven `signInProblem` strings.

---

## 10. Findings recorded, not fixed

| id | Finding |
|---|---|
| **IF-20** | `completeEmailLink` calls `window.prompt()` when the link is opened on a device that did not send it — the app's only browser dialogue, unstylable, and unavoidable without a screen that does not exist. Correct behaviour; recorded. |
| **IF-21** | `restoreAccount()`'s `notice` is computed, returned, stored on `state.session` and **read by nothing**. The email round trip's only account of itself is discarded (G-1). |
| **IF-22** | `signInNotice` is store state carrying pending, refusals, user errors and deployment errors in one string (G-4). |
| **IF-23** | `signIn()` returns `{ ok: false, sent: true }` for a sent email link — correct and easy to mistake for a failure. The panel handles it by reading `awaitingEmail()` rather than the return value, which is more robust and should be kept. |

---

## 11. Status

| Item | Status |
|---|---|
| **The email/redirect return leg is announced on the account row** | DESIGNED — new copy, **G-1**, the one new state |
| A boot-time sign-in error opens the sheet carrying it | DESIGNED — one line of routing |
| Pending on all three controls; `Sending the link…` de-interpolated | DESIGNED (P0-5) |
| The two sign-in buttons are one family | DESIGNED (P0-5 R11) |
| The email refusal moves to its field | DESIGNED — placement only |
| Six failure strings unchanged, including the two deployment ones | RECORDED — deliberately not softened |
| `CHECK YOUR MAIL` gains one sentence about the migration | DESIGNED — new copy |
| `awaitingEmail()` surviving a relaunch | RECORDED from source — the only such state, and correct |
| `Sign out` is not destructive | RECORDED — no confirm, no undo, no warning |
| A second arrival banner for the account | **REJECTED** — the account row is where the account speaks (§3) |
| Styling the `window.prompt` fallback | **DEFERRED** — IF-20, needs a screen |
| An artboard for this document | **REJECTED** — six near-identical crops of one panel; two states are already captured |

**No OPEN DECISION is raised by this document.**

---

## IMPLEMENTED — `63b9c06` (G-2, G-4) and `3453aa2` (G-1), 5 Sep 2026

**Appended only. Nothing above this line was changed.**

**G-2 and G-4** (batch 1). `state.signInNotice` carried pending, a user error
and seven Firebase deployment failures in one string, in one amber box. Split
as §5 requires: pending goes on the two `.sign-btn`s, the address refusal goes
beside the email field in rust, and the note slot keeps only failures. §4's
`Sending the link…` ships de-interpolated — the fifth such label, added to
P0-5's list rather than kept as a local exception. `Use a different address`
correctly gets nothing (R10).

**G-1 · the return leg is announced at last** (batch 6). `restoreAccount()`
computed a notice, `store.js` stored it on `state.session`, and nothing read
it — the one flow whose whole point is that it finishes on a later launch was
the one flow with no arrival. It is now one substituted sub-line on the
account row, consumed on first read so it shows once, with no dismiss control,
and an error code is deliberately not put there: a failure of an action the
user started goes where failures go.

**Verified locally:** the sign-in split in `test/pending-and-refusals.mjs`
(56 checks); the return leg in `test/backend-gated.mjs` (25 checks), including
that it is consumed once and that an error code never reaches the row.

**§3's non-owner Share view and §12.1** are recorded against
`p0-1-role-and-copy-identity-design.md`, implemented in `322098b`.
