# Existing UI — Visual Reference

**Hand-off document.** Give this (plus `docs/design/existing-ui-audit.md` and `docs/design/screens/current/*.png`) to any session that needs to design a new Travel Planner screen without rediscovering the app.

**Baseline refreshed 4 Sep 2026** against the current `main` (tree `4698f0e4a8b8`), which is what Firebase Hosting serves. The app changed after the first pass — real accounts, an account row on the trips home, sharing on a Firestore envelope — so every frame was re-captured and the outdated statements corrected. See *Revision log* at the end.

**Presentation standard:** every mobile screen is shown in the same **390 × 844 px** design frame, 1:1, identical scale across screens — normal, empty, edit, modal, sheet and warning states alike. The frame is a presentation convention only: the app was rendered at 390px wide and captured as-is, keeping its real 16px page padding, type sizes, card/sheet geometry and the 78px tab bar inside the viewport. Nothing was stretched, re-spaced or made taller to fill a frame; content past the fold stays scrolled, as on a phone. The 520px `#app` max-width is a web-shell cap, not a design width.

**Source of truth order:** the running app → `web/css/app.css` and `web/js/screens/*` → the screenshots here → this prose. Where they disagree, the earlier one wins.

**Board:** `Existing UI Visual Reference.dc.html` — the 20 screens, the pattern specimens, the colour and type boards, all annotated. Open it alongside this file.

---

## 1. The app in one paragraph

A mobile-first PWA (five bottom tabs, 520px shell cap) for a guided trip: the agent's itinerary on one axis and everything you plan yourself on the other. Vanilla ES modules, no framework, no build step, one 2,187-line stylesheet. Visually quiet and dense — bone page, white cards, small heavy type, no illustration, no photography (hatched placeholders stand in), and colour used only to mean something. Everything works signed out on one phone; signing in (Google or an emailed link) exists so trips survive the phone and so a shared link can reach them.

## 2. The semantic colour contract

The single most important rule in the product. Breaking it breaks the app's whole explanation of itself.

| Colour | Value | Means | Where it appears |
|---|---|---|---|
| **Jade** | `#1F6F5C` | The itinerary you were **given**; saved; confirmed | Main-route pins and spine, `MAIN` badges, Save buttons, progress fill, ticked checkbox, saved sync dot, active category chip, the `CHECK YOUR MAIL` state |
| **Amber** | `#C87F0A` (text `#8A5A08`, surface `#FBF1DE`, border `#EBD9B4`, paper `#FFFDF7`) | Something **you** planned, or something **guessed** | Sub routes and free-time lanes (always dashed), Nearby button, warnings, `input.guessed`, queued sync dot, in-progress day meta |
| **Ink** | `#14201C` | All text — and the surface that means **act now** | Primary buttons, `Sign in`, Nearby dock, undo bar, spend hero, active tab/pill fill, FAB |
| **Rust** | `#9B4B4B` (surface `#F8E9E9`) | **Destructive**, or broken and needing attention | Swipe-delete track and bin, in-row confirmation, stuck-changes card, expired-link badge, over-plan chip, remove `✕` |
| **Bone** | `#F2F3F1` | The page. Also chips at rest and the active tab pill | Everywhere behind cards |
| **White** | `#fff` | Every card, header, sheet, form and the account row | Everywhere |
| Text ramp | `#14201C` → `#3D4C46` → `#6B7A74` → `#98A5A0` → `#B4BEB9` | ink → charcoal (body on cards) → muted (secondary) → soft (tertiary/eyebrows) → faint (derived values, captions) | Everywhere |
| Lines | `#E7EAE7` / `#EDEFEC` / `#F0F2F0` | Card border / row divider / lightest list hairline | Everywhere |

Rules that follow: **dashed always means "yours" or "not yet real"**; a jade banner informs, an amber banner warns, a rust banner means something is broken; a card never uses colour decoratively.

## 3. Geometry, confirmed

- Shell **max-width 520px**, centred, `100dvh`, `overflow:hidden` — a cap, not a design width; the mobile design frame for this reference is **390 × 844**. One breakpoint at 560px that only darkens the page around the shell to `#E4E6E2` and adds a hairline ring.
- **16px** page side padding (headers, lists, sheet heads, map top).
- **14px** card padding (12–13px on plan cards, 11–14px on list rows, 10px/12px on the account row).
- Radii: cards **16** (plan 14, nearby/trip 15, account row 14), controls/inputs **10–12**, chips **8–10**, badges **6–7**, floating furniture **17–18**, sheets **22** (top corners only).
- Buttons **h42 r12 13px/700**; small **h38 12.5px**; dashed add **h48 r14**; `.sign-btn` **h48 r12** outline (the two ways in only).
- Inputs 13px, **r10**, 1px `#DDE2DE`, padding `9px 10px`; focus changes the border to jade — **no focus ring anywhere in the app**.
- Bottom tab bar **78px** (`7px 8px calc(10px + safe-bottom)`), translucent white + 14px blur, 1px `#E4E8E5` top line, tabs min-height 46px, active = bone pill r12, label 9.5px/800, icons the inline SVGs in `util.js` (`icon.tabMap/tabPlan/tabShop/tabPrep/tabLog`, `#14201C` active / `#9AA6A1` inactive).
- Sheets: three detents **30% / 50% / 82%**, remembered per sheet for the session; 40×4 grab bar.
- Shadows: `0 2px 10px rgba(20,32,28,.07–.12)` small floating · `0 8px 26px .18` docks · `0 -8px 30px .16` sheets (upward) · `0 14px 44px .3` modal. Cards themselves are usually flat with a 1px border.
- `env(safe-area-inset-*)` in every header, the tab bar, the hero back button and sticky feet.
- Motion is ~0.18s and rare: swipe transform, sheet settle, pin focus, boot fade. No entrance animations.

## 4. Typography, confirmed

Public Sans (self-hosted, **400/600/700/800**), `system-ui` fallback, antialiased.

| Role | Spec |
|---|---|
| Page title | 24px / 700 / `-.02em` (`.screen-title`) |
| Push title | 17px / 700 / `-.01em` (`.push-title`) |
| Section heading | 10.5px / 800 / `.06em` uppercase eyebrow (`.eyebrow`) — the only heading level between title and row |
| Body | 12.5–13.5px / 1.45–1.55 / `#3D4C46` |
| Row title | 13.5–14.5px / 600–650 |
| Label | 11px / 400 / `#98A5A0`, above the field |
| Caption | 9.5–10.5px / `#B4BEB9` |
| Time | 12.5/700 start · 11px/650 derived end · 10.5px duration — **always `tabular-nums`** |
| Money | 20px `.spend-v`, 36px/700/`-.025em` `.spend-big` — **always `tabular-nums`**, formatted by `util.money` |
| Mono | `ui-monospace, Menlo, monospace` — pasted itinerary text only |

Hierarchy comes from **weight + size + colour**, never from a second family. The source also uses weights **550 and 650** which are not loaded; the browser synthesises them. Preserved as-is.

## 5. The patterns to reuse

**Shell:** `.screen` (flex column, hidden overflow) → `.head` (white, 16px sides, 1px bottom line, safe-top padding) → **one** `.scroll` → optional fixed footer card/dock. Global slots below: strip → undo → tab bar.

**Header:** either `.screen-title` + `.screen-sub` + one 40px filled icon button (tab-level screens), or `backHeader()` = back chevron + `.push-title` + `.push-sub` (push screens). Note-style editors use `✕` + title + a jade **Save** in the header instead.

**Cards & lists:** `.card` r16 / `.card-list` r16 + `overflow:hidden`; group head, then rows separated by a 1px `#F0F2F0` hairline. No borders between rows, no shadows inside cards. Done items struck through in `#9AA6A1`.

**Buttons:** ink = act · jade = save/confirm · ghost (bone + `#E1E5E1` border, weight 650) = the alternative · dashed = add · `.sign-btn` = a way in · amber-on-amber only for the Nearby affordance. Disabled = `opacity .45` + `pointer-events:none`. No hover states exist.

**Forms:** `.form` = white card with a **1.5px ink border**, r16, 14px pad, 8px gap; 11px soft label above each field; actions = jade `.grow` + ghost 96px; an 11px soft hint closes the card explaining the consequence.

**Account row (`.acct`):** white, r14, 1px `#E7EAE7`, above the trips list. Signed out: "Everything is on this phone" + what signing in buys + ink `Sign in` (h38). Signed in: 30px `.who-mark` initial, name, email, ghost `Sign out`. It never blocks — nothing below it needs an account.

**Sign-in (`signInPanel()` / `mountSignIn()` in parts.js):** one shared panel used in the trips modal and in the join flow. Name field, `Continue with Google`, an eyebrow divider, email field, `Send me a link`, fine print. Sent state = jade `CHECK YOUR MAIL` + ghost "Use a different address". No passwords; Apple is deliberately absent (paid developer account).

**Small labels — four families, four jobs.** Do not merge them: `.pill` (h32 r10, ink when on — pick a day/mode) · `.cat` (h30 r9, jade when on — filter) · `.chip` (r8 10.5px — inline metadata) · `.badge` (r6 9.5px/800 — provenance, `MAIN`/`SUB`).

**Warnings:** a strip **on the row it concerns** (`.warn` = amber surface, 10.5/800 label, 11.5px text) that always names the tap that fixes it — first fix ink, alternatives ghost. Never a toast, never a dialog.

**Empty states:** 28px/16px centred, 12.5px soft, one or two sentences that *teach the model*, then one ink primary and one ghost alternative. No illustration. (The trips-home empty copy now differs signed in vs signed out.)

**Delete:** one implementation (`swipeToDelete()`), five positions — rest → drag (red fills behind the finger) → **latch at 88px** with `DELETE` showing → **confirm inside the row** (a decisive swipe past 60% jumps here, never straight to delete) → gone, with 6 seconds of undo in one app-wide ink bar above the tab bar.

**Modals & sheets:** `.scrim` (`rgba(20,32,28,.34)` + `saturate(.55)`) + `.modal` docked **12px from the bottom** holding a `.form`. **Nothing is ever centred.** Full-height alternative is `.sheet` with the three detents. The only blocking interactions in the app are creating a trip and signing in.

**Docks:** ink, r18, inset 12px, always **naming what the action will act on** (which loop, which day) with a coloured action button on the right.

**Images:** hatched placeholder (`repeating-linear-gradient(135deg, #E2E6E2 0 10px, #DADFDA 10px 20px)`) at rest, `object-fit:cover` once a real photo exists. The hatch *is* the house style, not a stub.

**Map:** Leaflet with all controls hidden; 32px jade numbered pins, 40px ink for slack, 18px white/amber-ring and 28px amber for sub routes; `.pin-focus` = 3px jade outline + `scale(1.12)`; a small legend explains solid jade = main, dotted amber = sub.

**Copy tone:** plain sentences, second person, lower-case after the first word, state the consequence, no marketing voice, no exclamation marks. e.g. "They get a copy, not a live view." · "It is read on this phone; nothing is sent anywhere." · "Everything is on this phone." · "There is no password."

**Known markup defect (recorded, not fixed):** in Plan's edit mode the sub-route row emits already-quoted values into quoted attributes (`data-loop-name="&quot;Market"` + a stray `afternoon=""`). The UI renders correctly; DOM-serialising tools choke on it. See audit §12.16.

## 6. Screens

Verified (screenshots in `docs/design/screens/current/`, all 390 × 844):

`01-trips-home` (with the account row) · `02-sign-in` (**new**) · `03-new-trip-modal` · `04-map-home` · `05-map-focused` · `06-plan-read` · `07-plan-edit` · `08-plan-empty` · `09-destination` · `10-nearby` · `11-shop` · `12-spend` · `13-prep` · `14-log` · `15-note-editor` · `16-trip-settings` · `17-share` · `18-offline-areas` · `19-paste` · `20-join-dead-link` (**new** — the expired-link ending)

**VERIFIED 4 Sep 2026** by the P0-6 sprint — 16 further frames at `docs/design/screens/verify/`, all 390 × 844: share offer/linked/manage · plan update banner · review entries, bulk actions and after-deciding · **join live invite** · sub route (partial) · paste review pass · draw an area · changes on this phone (jade only). See `docs/design/verification-sprint-p0-6.md`, including two contamination disclosures.

**STILL SOURCE-ONLY — VISUAL NOT VERIFIED:** the rust `.stuck-why` waiting state (structurally needs an unreachable Firestore) · the sub-route `.loop-row` list, edge markers and back-by form (need a real drag) · tile-download progress · paste `Ready to save`/`done` · the sticky feet on Join and Share.

**Two claims in this document were wrong and are corrected:** the join invite's preview card shows **the selected day, not Day 1**, and the "If you join" block has **four** promises, not three. **Partly verified:** join — the expired-link ending is frame 20 and its sign-in phase is the shared panel in frame 02, but the live invite (from-line, read-only Day 1 look, three promises, sticky foot) still needs a real published envelope from another account. Structure for all of these is described from source; **appearance is not established and no mockup of them exists.**

## 7. Non-negotiables for a new screen

1. Copy an existing screen of the same shape; keep `.screen` → `.head` → one `.scroll`.
2. Use `parts.js` before writing anything new (now including `signInPanel`/`mountSignIn`).
3. Only `:root` tokens, only in their existing meanings.
4. Never demand an account: sign-in is offered, states what it buys, and everything works signed out.
5. Delete = swipe → in-row confirm → undo. No centred dialogs.
6. Tabular numerals on every time and money value.
7. Hatched placeholder where a real asset does not exist.
8. Mobile-first; design at **390 × 844** and let the 520px shell cap handle wider viewports. Do not introduce a desktop layout.
9. No build step: one screen file, one `register()` line, and only if unavoidable a new block at the **end** of `app.css`.
10. Existing inconsistencies are **preserved** until explicitly approved for change.

## 8. Revision log

**4 Sep 2026 — baseline refresh against `main` (`4698f0e4a8b8`).** One commit had landed since the first pass, touching `index.html`, `app.js`, `persist.js`, `store.js`, `sw.js`, `css/app.css`, `screens/{trips,join,parts}.js` and `firebase/firestore.rules`.

Outdated statements corrected:

1. **Anonymous auth is gone.** The app no longer creates anonymous accounts; sign-in is Google or an emailed link, an existing anonymous uid is *linked* rather than replaced, and `firestore.rules` says so explicitly.
2. **The trips home has an account row** (`.acct`) above the list — a visible change to the first frame in this reference.
3. **A sign-in sheet exists** (`signInPanel()`), reachable from the account row and from the join flow. New frame 02.
4. **Sharing is a real backend now:** `published/{code}` in Firestore, one document per link code, `get` allowed to anyone holding the code, `list` denied, editors claimed by adding your own uid. The previous "localStorage envelope, item 31 is swapping the two" note is obsolete (a localStorage *mirror* of the last-seen envelope remains, for offline).
5. **`firebase/firestore.rules` exists** and is substantial. The earlier audit called it absent — that was wrong: it is not an importable file type, so it did not appear in the file listing used at the time.
6. **`sw.js` is at v5** and now caches `screens/share.js`, `screens/join.js`, `screens/review.js` and `js/share.js`; the stale `screens/mustsee.js` entry is gone. The earlier note about those four being uncached is obsolete.
7. **`index.html` declares `<base href="/">`** so an invite path (`/j/CODE`) resolves the app's relative assets.
8. **Still true:** `manifest.webmanifest` is referenced by both `index.html` and `sw.js` and still does not exist in the repo.

Unchanged and re-confirmed: all colour tokens and their meanings, type scale, geometry, the four label families, the delete gesture, sheet detents, modal docking, warning pattern, empty-state pattern, hatched placeholders, map treatment, mobile-only responsive behaviour, and the absence of hover and focus styling. The only new CSS in the commit is the `.acct` block.
