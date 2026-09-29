# P3 — People and coordination: Gather, "I'm here", and the hand-off

**Date:** 29 Sep 2026 · **Verified against** the working tree on `claude/intelligent-pasteur-ebuo53`, read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** *Harbour Garden* rev 5, plate 02 (Today, with Gather on it).
**Canonical:** this document for the coordination surface, the hand-off family and the emergency screen.
**Depends on:** `p3-information-architecture.md` — D-8 (Gather lives on Today), D-20 (pink is functional), D-23 (emergency is brown).

**Source read this session:** `src/store.js` `people` (2844 `people: []`, 4623 `sharePeople`, 4692 the synthetic owner, 5098 `setRole`, 5112 `removePerson`, 5139–5179 `joinTrip`, 5296 `me()`) · `src/screens/parts.js` `mapsLinks` 185–199 · `src/share.js` `SHARED_KINDS` 69 / `PRIVATE_KINDS` 72 · `src/nav.js` `TABS`.

**Fixed foundations, not reopened:** sharing is snapshot-and-review, not live sync · it must work offline · no paid APIs · group messaging hands off to WhatsApp rather than being rebuilt (settled with the owner, 23 Sep) · no spinner, overlay or skeleton anywhere.

**Out of scope, deliberately:** push notifications (designed *for*, not built — §8) · live location sharing · any backend.

---

## 1. What exists today

| Claim | Verified | Verdict |
|---|---|---|
| "The app knows who is on the trip" | `trip.people[] = { id, name, role, joinedAt }` (`store.js:5179`). Roles are owner/editor/viewer; `joinTrip` folds a joiner in. | **Right, and thin.** |
| "People can be contacted from the app" | There is **no phone number and no contact field of any kind.** `sharePeople()` returns names and roles. | **Wrong. No hand-off is possible today.** |
| "There is already a hand-off pattern" | `mapsLinks` (`parts.js:185`) builds Google, Apple and walking-directions URLs, encodes its queries, and prefers coordinates over text. | **Right**, and it is the pattern this document extends. |
| "There is a coordination screen" | Nothing. The word "gather" appears nowhere in `src/`. | **Wrong. This is entirely new.** |

**So the work is one field, one screen and one URL family** — not a messaging system.

---

## 2. The principle

> **The app owns the facts. WhatsApp owns the conversation.**

A gather has three facts: a **time**, a **place**, and **who has said they are there**. All three live in the app because all three are trip data that must survive with no signal. The *message* leaves through WhatsApp, where the group already is.

**D-1. Gather lives on Today, directly under the free-time figure.** Not a tab (IA D-8), not a sheet you have to remember exists. The order on Today is: how long you are free → where everyone meets → emergency. That is the order the questions actually arrive in.

**D-2. The app never claims knowledge it does not have.** It knows who tapped `I'm here`, because that happens inside it. It cannot know whether a WhatsApp message was delivered or read, so it says nothing about that — no ticks, no "sent", no "seen". One line on the screen states this in plain words rather than leaving the user to infer it.

This is the same honesty rule as the sync colours and the warning strip: the app reports what it observed, never what it assumes.

---

## 3. `people` becomes a kind

**D-3. People move from a field on the trip to their own collection.**

Today `trip.people` is an array on the trip document. Every coordination feature needs more per person than a name, and every write to the array is a whole-trip write. `people` joins `KINDS` (Phase 2, `p3-` documents do not implement it).

| Field | Why |
|---|---|
| `id`, `name`, `role`, `joinedAt` | carried over unchanged from `trip.people` |
| `phone` | E.164, the thing that makes every hand-off possible |
| `whatsapp` | usually the same as `phone`; separate because it is not always |
| `relationship` | free text — `sister`, `tour guide`, `hotel front desk` |
| `emergencyContact` | boolean — appears on the emergency screen |
| `colour` | which of the palette's tints marks their avatar |
| `uid` | present only for someone who actually signed in |

**D-4. A person with no phone number is still a person.** Every contact field is optional. The hand-off buttons for that person are absent, not disabled — the app does not show a control that cannot work (`implementation-readiness-map.md` §5: no pre-disabled primary).

**D-5. `people` is shared, but only as identity.** It joins `SHARED_KINDS` carrying `id`, `name`, `role` and `colour`. **`phone`, `whatsapp`, `relationship` and `emergencyContact` never travel in a share.** A share link is a snapshot handed to someone; it must not carry the group's phone numbers to whoever holds the code. Stated here so the Phase 2 kind registry declares it rather than discovering it.

---

## 4. Gather

### 4.1 The card on Today

```
GATHER · EVERYONE MEETS
15:00
Jagalchi Market, main gate
[WS] [M] [R] [J]   2 of 4 here
( I'm here )                          ← pink, the one primary
( Share time, place and pin → WhatsApp )   ← ghost
```

**D-6. The time is the largest thing on the card**, set in Fraunces at 26–44px. It is the fact people open the app to check.

**D-7. An avatar is green when that person has said they are there**, outlined when they have not. Not a tick, not a colour scale — two states, because there are two.

**D-8. `2 of 4 here` is stated in words as well as avatars**, because four circles are a picture and a count is a fact.

**D-9. Below the avatars, one sentence names who is missing:** `Wei Sze and Mei are here. Ravi and Jun have not said yet.` "Have not said" rather than "are not here" — the app knows about taps, not about people.

### 4.2 Setting one

**D-10. A gather is set from Today, and carries the place from the plan where possible.** Setting one on a day that has stops offers those stops first, then a map pin, then free text. The app already resolves places well; a gather should not make you re-type one.

**D-11. A gather belongs to a day, and there is at most one per day.** A second gather on the same day replaces the first and says so. Multiple simultaneous meeting points is a coordination problem the app cannot solve honestly without live sync, which is closed.

**D-12. `set by Wei Sze at 11:40` is always shown.** Who set it, and when. A time nobody can trace is a time nobody trusts.

### 4.3 `I'm here`

**D-13. `I'm here` writes a local record and is instantly undoable.** Tapping it again clears it; no confirm, no undo bar — it is not destructive and it is not delete, so it does not use the delete ladder.

**D-14. Statuses travel in the same snapshot-and-review channel as everything else.** They are not live. A recipient sees them when they pull; there is no promise that they are current, and the card states the age of what it is showing when it is more than fifteen minutes old: `as of 12:40`.

This is the honest consequence of the no-live-sync decision. It is not a limitation to hide.

---

## 5. The hand-off family

**D-15. `mapsLinks` gains a sibling, `handoff`,** built the same way and in the same file.

| Function | URL |
|---|---|
| `handoff.whatsapp(number, text)` | `https://wa.me/<E.164>?text=<encoded>` |
| `handoff.whatsappGroup(text)` | `https://wa.me/?text=<encoded>` — no number; the user picks the chat |
| `handoff.sms(number, text)` | `sms:<number>?&body=<encoded>` |
| `handoff.tel(number)` | `tel:<number>` |

**D-16. Every argument is encoded, always.** `mapsLinks` already does this. A name containing `&`, a `#`, an emoji or a newline must survive; this is asserted rather than assumed (§7).

**D-17. The composed gather message is fixed copy plus facts:**

```
Gather 15:00 — Jagalchi Market, main gate
https://maps.google.com/?q=35.0966,129.0306
(Seoul → Busan, day 4)
```

Three lines: the fact, the pin, the context. No app branding, no "sent from", no link back to the app. A message the recipient would have typed themselves.

**D-18. The pin uses coordinates when the place has them and the name when it does not** — the same preference order `mapsLinks` already applies.

---

## 6. Emergency

**D-19. Emergency is one control on Today, and one screen behind it.**

The control is a brown block with a pink label, at the bottom of Today, always in the same position. **It requires a three-second hold**, not a tap, and not a confirm dialogue — a confirm dialogue in an emergency is a second thing to read.

**D-20. The emergency screen works with no signal, and is designed for being read aloud over a phone call.**

| Element | Why it is there |
|---|---|
| Your coordinates, as large selectable text | so they can be read out, or copied into any app. Not a map — a map needs tiles |
| The nearest stop's name and the day's city | a human-readable location for someone who cannot use numbers |
| The trip country's emergency numbers, as direct-dial buttons | `112` and `119` for Korea. From a static table in the app, not fetched |
| Everyone marked `emergencyContact`, as direct-dial buttons | the group first, because they are the nearest help |
| `Send my location → WhatsApp` | the same hand-off, pre-composed |

**D-21. No colour on this screen is decorative.** Brown ground, cream text, pink only on the controls. Nothing animates.

**D-22. The emergency numbers table ships with the app.** A country-code → numbers map in static content, precached by `sw.js`. It is small, it never changes, and looking it up over the network is exactly the thing that will not work when it is needed.

---

## 7. Test obligations

Per the standing policy, each is a check that fails before the feature exists.

1. **Hand-off URLs are built correctly and escaped.** A person named `Ravi & Jun`, a place with an emoji, a note containing a newline — the resulting `wa.me` URL must round-trip. This is the highest-risk piece of string handling in the feature.
2. **A person with no phone shows no call button**, rather than a disabled one.
3. **The emergency screen renders with the network down**, including the numbers table — the `offline-cold-boot` harness gains it.
4. **`phone`, `whatsapp`, `relationship` and `emergencyContact` do not appear in a share snapshot.** Asserted directly against the published envelope, not inferred from `SHARED_KINDS`.
5. **A gather status older than fifteen minutes shows its age.**
6. **`I'm here` toggles**, and does not use the undo bar.

---

## 8. The hole left for push notifications

**D-23. Nothing here is built on the assumption that a message can be delivered.** A gather is a fact you pull; `I'm here` is a fact you push into your own copy. If push notifications are added later (a genuine no-server exception, per the settled rule), they become a *delivery mechanism for facts that already exist* — `Gather moved to 15:30` — and no screen in this document changes shape to accommodate them.

That is the test of whether the hole is the right shape, and it passes.

---

## 9. Decisions

1. **D-1** Gather lives on Today, under the free-time figure.
2. **D-2** The app never claims a message was delivered or read, and says so on screen.
3. **D-3** `people` becomes its own kind, with contact fields.
4. **D-4** Contact fields are optional; absent controls, never disabled ones.
5. **D-5** People travel in a share as identity only — never phone, WhatsApp, relationship or emergency flag.
6. **D-6** The gather time is the largest element on the card.
7. **D-7** Avatars have two states: here, or not yet said.
8. **D-8** The count is stated in words as well as drawn.
9. **D-9** One sentence names who has not said yet.
10. **D-10** Setting a gather offers the day's stops first.
11. **D-11** One gather per day; a second replaces the first and says so.
12. **D-12** Who set it and when is always shown.
13. **D-13** `I'm here` toggles, with no confirm and no undo bar.
14. **D-14** Statuses are not live; anything older than fifteen minutes states its age.
15. **D-15** `parts.js` gains a `handoff` family beside `mapsLinks`.
16. **D-16** Every hand-off argument is encoded, and it is tested.
17. **D-17** The gather message is three lines: fact, pin, context. No branding.
18. **D-18** Coordinates preferred over names, as `mapsLinks` already does.
19. **D-19** Emergency is one held control on Today and one screen behind it.
20. **D-20** The emergency screen is built to be read aloud, with no network.
21. **D-21** Nothing on the emergency screen is decorative, and nothing animates.
22. **D-22** Emergency numbers ship as static content and are precached.
23. **D-23** Push notifications are designed for and not built; no screen changes shape if they arrive.
