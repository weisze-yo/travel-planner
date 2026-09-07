# Brief for Claude Design — Travel Planner, seven decisions

**Status: FINAL, 7 Sep 2026.**

You are designing inside an app that already exists and already has a voice. Nothing here is a
greenfield screen. Seven things need a decision; everything else in the app should look untouched
afterwards.

**They are not the same size, and §3 is ordered accordingly.** §3.1–§3.4 are presentation questions
where the data is settled and only the treatment is open. §3.5–§3.7 are three more that came out of
a round of manual testing on a real phone: one is a component the whole app shares, one is an
interaction change, and the last is a screen restructure that is the largest thing in here. If you
have to triage, **§3.7 is the one where a good answer changes the most**, and §3.5 the one that
quietly touches the most screens.

---

## 1. What the app is

A static ES-module PWA — no framework, no build step, no component library. Screens are plain
objects with a `render()` returning an HTML template string and a `mount()` binding delegated
handlers. All styling lives in one file, `web/css/app.css` (~77 KB, hand-written).

It is a **travel companion used one-handed, outdoors, on a phone, often in bright sun and often in a
hurry**. A 45-seat coach is leaving in four minutes. That is the design constraint behind everything
below: legible at a glance beats elegant on inspection.

The current content is a real trip — 8 days, 40 stops, 532 nearby places, 60 must-see shots, 96
shopping items, all with verified opening hours and provenance.

## 2. The design system you must work inside

**Read `web/css/app.css` first.** Do not introduce a second palette, a second type scale, or a
component library.

### Colour tokens, and what each already MEANS

```
--jade    #1F6F5C   good · done · primary action · "on track"
--amber   #C87F0A   needs attention · "if time" · a warning that is not an error
--danger  #9B4B4B   destructive · error  (--danger-bg #F8E9E9 / --danger-fg #9B4B4B)
--ink     #14201C   body text
--charcoal #3D4C46  secondary text          --muted #6B7A74   --soft #98A5A0   --faint #B4BEB9
--bone    #F2F3F1   page background         --line/--line-2/--line-3  hairlines
```

Each accent already carries a meaning. **Do not reuse one for a new meaning.** A new meaning gets a
new hue. There is precedent: a five-colour set is in `app.css` for the Must-tab
labels (§3.2), chosen to sit in the cool arc the palette leaves empty, and it stays out of
jade/amber/danger territory:

```
--sum-do #26327A (231°)  --sum-eat #7C2F72 (308°)  --sum-see #6A4FA8 (258°)
--sum-buy #1A7396 (197°) --sum-snack #B23F68 (339°)
```

### The accessibility bar — this is gated in CI, not advisory

`test/contrast.mjs` computes real WCAG ratios from the hex values and **exits non-zero** if any pair
introduced by a session drops below **AA 4.5:1**. The five above are in its gated set, measured on
both grounds — 11.54 / 8.38 / 6.37 / 5.33 / 5.52 on white, and 10.37 / 7.53 / 5.72 / 4.79 / 4.96 on
`--bone`. Every new foreground/background pair you propose
must clear 4.5:1 on **both** white and `--bone #F2F3F1`.

Two further rules the existing work holds itself to:

- **Colour is never the only cue.** Every one of the five summary labels pairs its hue with an
  uppercase text label. A reader who cannot separate the hues loses nothing.
- **Keep a luminance ramp.** The five summary colours span 11.5:1 down to 4.8:1 on white so they
  stay distinguishable in greyscale. Please do the same for any new set.

### Existing components to reuse rather than reinvent

`.chip` (with `.chip.jade` / `.chip.amber`) · `.eyebrow` (small caps section label) · `.card` /
`.card-list` · `.essential` / `.essential-k` / `.essential-v` / `.essential-d` (the key/value/detail
rows in the Info tab) · `.pill` (the D1–D8 day selector) · `.warn` strip · `.hero` with
`.hero-badges`.

---

## 3. The seven decisions

### 3.1 Morning / night / dawn hints on nearby places  — *the hardest one*

**The data:** every place carries `timeWindow`, one of `day` · `night` · `dawn` · `24h`. 517 of 532
have it. **84 of them are `night` or `dawn` records** — a 05:20 footbath, a floodlit bridge, a
public bath open till 21:00.

**The problem:** the Nearby tab on a single stop lists up to **31 rows**. Ginzan Onsen Street has 31,
Tsukiji 28, Tokyo Tower 27. A traveller scanning that list at 09:35 needs to know instantly that a
row is a *dawn* record and therefore irrelevant right now — without the list turning into a legend,
and without four colours competing with the row's own content (name, Japanese name, category, price
tier, walk time).

**What a row contains today:** name · `nameJp` · category label · price tier · stay minutes · the leg
chain (e.g. "walk 4 · train 15 · walk 3").

**Please decide:** how the four states read on a dense list. Consider whether all four need a mark at
all — `day` is the overwhelming majority and arguably the unmarked default, which would leave only
three marks and a much quieter list. Consider whether this is better as a filter/sort affordance
than a per-row mark, given the list is already long.

**Constraint:** whatever you choose must survive a row that is already two lines of text on a 375 px
screen, and must not read as a warning (that is `--amber`'s job).

### 3.2 The per-day outfit advice that exists but is invisible

**The data:** each of the 8 days has an outfit record carrying two paragraphs of researched prose:

- `x.suggestionPhoto` — how clothing reads against that day's actual backdrop. Real example:
  *"The Matsushima palette is blue-grey sea, near-black pine islets and VERMILION bridges. That makes
  two colours risky: dark green disappears into the pines, and orange or red fights the bridges."*
- `x.suggestionPractical` — the physical reality. *"Twenty hours and twenty minutes door to door in a
  cabin held near 23°C, so a light long-sleeve layer beats a jacket you have to carry."*

**None of it is rendered anywhere.** The Prep screen's "WHAT TO WEAR ON DAY N" card instead shows a
generic weather-band sentence derived from `trip.weather` — which for this trip is **empty**, so
every day currently reads *"No forecast for this day yet."*

**Please decide:** where these two paragraphs live and how they relate to each other and to the
existing "WHAT I AM ACTUALLY BRINGING" list below them. They are ~300–400 characters each, they are
genuinely different in kind (one is about photographs, one is about comfort), and they were until
recently the single biggest piece of finished content the app was hiding.

**One precedent, offered rather than imposed.** The same problem has just been solved once, for a
different body of hidden prose: each stop carries five researched lines (do · eat · snack · buy ·
see, ~480 characters each) that nothing rendered either, and they now live on a **Must** tab as five
collapsible sections — the label and its own hue on the header, a one-line truncated peek of the
text when closed, one section open by default. `.must-sec` in `app.css` is the shipped recipe, and
the five hues are the `--sum-*` tokens listed in §2. That is a per-stop answer to a per-day
question, so it may or may not suit here; reuse it, or depart from it deliberately and say why. What
would be worth avoiding is the app growing two unrelated ways to present the same *kind* of
thing.

### 3.3 An image slot that degrades honestly

**The state today:** the stop detail screen opens with `.hero.placeholder-hatch` — a hatched block
with the words "Photo placeholder". **There are zero images in the data.**

Images will arrive from Wikimedia Commons, licensed CC0 / public domain / CC BY / CC BY-SA, at
~1600 px. Coverage will be **partial and permanently so**: the 33 itinerary stops may get images;
the 532 individual places, 60 must-see shots and 96 shopping items mostly will not, because Commons
does not photograph individual market stalls.

**Please decide:** the image treatment for a stop hero, **and** what the same slot looks like when
there is no image — which will be the common case, not the exception. The fallback must not read as
broken or as a loading state.

**A licence condition, not a courtesy:** CC BY and CC BY-SA **require visible attribution**. Each
image carries `credit` (e.g. an artist name) and `sourcePage` (a Commons URL). Your design must
include somewhere legible for that credit line. It cannot be hidden behind a tap.

### 3.4 Where a full-text search box lives  — *deliberately bounded*

**Not yet built, and the mounting point is genuinely open.** One box over 688 records (532 places +
60 must-see + 96 shopping), matching English and Japanese names.

**Two questions only, and they are both small:**

1. **Where is search invoked from?** The two candidate homes both have a problem. `nav.js` has a
   **fixed five-entry tab bar** — Map · Plan · Shop · Prep · Log — and a sixth changes the whole
   bar's rhythm, which is why this belongs in the same round as the other three rather than after
   them. `strip.js` is a **single-slot ranked warning strip** above the tab bar that shows one thing
   at a time; a permanent search box would occupy the slot the warnings need.
2. **What does a result row look like?** It must carry: record name, Japanese name where present,
   `Day N · Stop name`, and which kind it is (place / must-see / buy). Retired records must be
   visibly marked, so a searcher is not sent to a hotel the group is no longer staying at.

**What is NOT being asked, and should not be redesigned.** The behaviour after selection is already
specified and settled: switch to the itinerary, navigate to that record's day, open its stop, scroll
the matching row into view, flash-highlight it for ~2.4s, then clear the query and close the list.
Likewise the mechanics: a two-character minimum, a 30-result cap, prefix matches ranked above
substring, `Escape` clears, clicking outside closes without clearing, and an empty state that reads
`Nothing matches "<query>".` rather than showing a blank panel.

Please treat all of that as fixed. **Two artboards — an invocation and a result list — is a complete
answer to this section.** It is scoped this tightly on purpose: the implementation behind it is the
largest remaining piece of work in the project, and the design decision is worth having early
precisely so it does not gate that work later.

The one genuinely open sub-question, if you want it: the flash-highlight needs a treatment that
survives `prefers-reduced-motion: reduce`, which the stylesheet already honours elsewhere. A
non-animated equivalent is welcome.

### 3.5 The select control, everywhere  — *smallest ask, widest reach*

**Reported as:** *"the design of dropdown for Payment Method and Category are not nice."* True, and
the problem is not those two dropdowns.

**What is actually there.** `app.css` strips native form rendering globally:

```css
input, textarea, select { … -webkit-appearance: none; appearance: none; }
```

so every `<select>` in the app wears the text-field recipe — 1px `--field-bd`, 10px radius, 13px
ink — plus one hand-drawn chevron as a background SVG, 11px from the right edge:

```css
select { background-image: url("…10x6 chevron, stroke #6B7A74…");
         background-position: right 11px center; padding-right: 28px; }
```

That is the entire design of a select in this app, and there are **eleven of them across five
screens**: `nearby.js` (a category), `parts.js` (a place), `plan.js` (a saved place, a lane start, a
lane end), `shop.js` (payment, category, a place, a new category), `sub.js` (a loop start, a loop
end).

**Two distinct jobs, currently indistinguishable.** Some are ordinary form fields inside a
`.form` card — full width, labelled, one per row. But the two the report names are **inline, inside
a shopping row**, wrapped in `.pay-chip` (`padding: 4px 9px; border-radius: 8px; background:
#EFF1EE; font-size: 10.5px`) and sitting in a wrapping flex row beside a PAID field. A 13px select
inside a 10.5px chip is where the "not nice" comes from: the chip and the control it holds disagree
about their own size.

**Please decide:** the select's own treatment, and whether the inline case is the same component
smaller or a genuinely different one. A "value + chevron" text button that opens something is a
legitimate answer for the inline case; so is making the chip and the select agree. **Two artboards
— a form select and an inline select in a shopping row — is a complete answer.**

**Constraints.** It has to stay a real `<select>` (the native picker is the right control on a phone
and is what a one-handed user in a hurry expects), so you are designing the closed state and the
affordance, not the open list. It must not read as a text input the user should type into — that
ambiguity is the current bug. And it appears on `--bone`, on white cards, and inside `#EFF1EE`
chips, so the recipe has to survive all three grounds.

### 3.6 The Add-a-stop form: inline, or over the plan

**Reported as:** *"make this 'Add a stop' card in front, which disables other navigation behind it
with a greyish transparent layer."*

**What is there.** In Plan's edit mode the form is `.form` rendered **in the flow**, immediately
below the itinerary and immediately above the two controls that opened it:

```
[ the day's stops … ]
[ .form  "Add a stop"  ← appears here ]
[ + Add a stop        ]   ← the button that opened it, still visible below
[ Paste an itinerary  ]
```

So the button that spawned the form stays on screen underneath its own result, and on a 375px screen
the form can push the day's stops out of view entirely while you fill it in.

**The app already has the other pattern**, used by the three sheets on the Destination screen:
`.scrim` (`inset: 0; background: rgba(20,32,28,.34); backdrop-filter: saturate(.55)`) plus `.modal`
(bottom-anchored, `left/right: 12px; bottom: 12px; max-height: calc(100% - 40px)`, a 44px shadow).
The scrim doubles as a cancel affordance and goes non-interactive while a lookup is in flight.

**Please decide:** whether Add-a-stop becomes that, and if so what it costs. The honest tension is
that this form is the one place in the app where **you want the itinerary visible while you type** —
a stop's time only makes sense against the times around it — and a bottom sheet over a scrim hides
exactly that. A partial-height sheet, a sheet that leaves the relevant rows showing, or a stronger
in-flow treatment that simply owns its space better are all real answers. **Say which you rejected.**

**Note:** the two duplicate controls in that stack have already been removed, and the empty-day
state now points at the pencil rather than offering its own copies of these buttons. So you are
deciding the form's own presentation, not untangling four buttons.

### 3.7 The Nearby tab and the sub-route pick  — *the largest one*

This is a restructure, and it comes from the owner's own reading of the flow rather than from a
single bug. Read §3.7 fully before drawing.

**Where a place lives today, and how you reach it.** Two screens are involved:

1. **A stop's `Nearby` tab** (inside Destination). Lists the places saved around that stop as
   `.nearby-card` rows — thumbnail, name, price tier, `category · N min away`, and a round `+`/`✓`
   button that toggles the place into the day's sub route. Below the list sits one dashed button,
   **"Manage places for this stop"**.
2. That button pushes to the **Nearby screen** (`nearby.js`) — a fuller surface with a category
   chip row, a sort menu, swipe-to-delete, an "+ Add a place" form, and a **fixed bottom dock**
   carrying the sub-route switcher and an "Arrange" button.

So adding a place takes two screens, and the second one duplicates the first one's list.

**What the owner wants, as stated:**

- **"Manage places for this stop" becomes "Add a place"** — and the Nearby tab should *already be*
  the managing surface, so the button is not a doorway to a second copy of the same list.
- **Sub-route management leaves the Nearby tab.** Arranging and switching sub routes should happen
  from the **Plan** screen only. The Nearby tab is for places.
- **The per-card `+`/`✓` becomes a sub-route dropdown.** Today the round button toggles the place
  into whichever sub route the dock happens to name — which is why the dock exists, and why it has
  to be there to disambiguate. Instead: a **dropdown listing the day's sub routes by name**, so
  choosing one puts the place in it and leaving it empty means the place is simply saved. This
  removes the need for the dock, and for "whichever loop is in hand".
- **The sub-route card, when shown, goes dark** (`--dark-card #3D4C46`; there is precedent in
  `.swipe-face.archive-card`) and sits where it currently sits after entering manage-places.
- **A day can hold more than one sub route** — plural is the normal case, not an edge one, which is
  exactly what the dropdown has to handle gracefully.

**What this collides with, and you should decide rather than inherit.** Folding the Nearby screen's
capabilities into a tab means finding room for a category filter, a sort control, swipe-to-delete,
and an add form **inside a tab panel that is already inside a scrolling Destination screen with a
hero, a name, two map buttons and a five-tab bar above it.** That is the real design problem here.
Something has to give: the filter and sort may not both survive, the fuller screen may still deserve
to exist for the day-wide "Around day N" case (which has no single anchor stop and groups by stop),
or the tab may become a genuinely different, shorter thing.

**What has already shipped, so you are drawing against a real screen, not a description.** As of
7 Sep the Destination screen distinguishes a **stop** from a **place saved near one**:

- A **stop** shows five tabs: `Info · Nearby · Must · Shop · Notes`.
- A **nearby place** shows three: `Info · Nearby · Notes`. Must and Shop are hidden there, because
  those records anchor to a stop and can never point at an individual place.
- A nearby place also carries a context line under its name — *"Café · ¥¥ — 4 min from Ginzan Onsen
  Street"* — and a `.linkrow` at the foot of its panels offering the parent stop's own records as a
  count and a way back: *"At Ginzan Onsen Street · 5 lines on the stop · 4 must-see spots"*.

**So the tab bar is not uniform, and your answer must hold for both shapes.** A place's Nearby tab
lists what is near *that place*; a stop's lists what is near the stop. Both use the same cards.

**Real numbers, measured on the live trip.** A stop's Nearby list runs to **31 rows** (Ginzan Onsen
Street), 28 (Tsukiji), 27 (Tokyo Tower); 517 of the 532 places are anchored to a stop. And the sub
routes are more plural than "more than one" suggests — **17 across the trip, and Day 7 alone has
five**:

| Day | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|--:|--:|--:|--:|--:|--:|--:|
| Sub routes | 1 | 2 | 2 | 3 | 2 | **5** | 2 |

**So the dropdown has to hold five named options and stay legible on a row that is already two lines
of text.** That is the constraint that decides this control, and it is why the round `+`/`✓` plus a
dock was chosen in the first place. Day 1 has none at all, so the empty case is real too: design
what the control is when the day has no sub routes yet — including whether it appears.

**Please deliver, at 375px:** the Nearby tab as the managing surface (a stop's, with a real 30-row
list — show the top of it and say what happens at row 31); the per-card sub-route dropdown in its
closed state, both empty and with a sub route chosen; the dark sub-route card in place; and **one
line on what you dropped from the current Nearby screen and why.** If you conclude the fuller screen
must survive for the day-wide case, say so — that is a legitimate answer and the owner would rather
hear it than receive a design that quietly loses a feature.

---

## 4. What to deliver

Artboards at **375 px** (the design width; the app is phone-first). For each of the seven:

1. The proposed treatment, in context — inside a real screen, not floating on a blank artboard.
2. **Every new colour as a hex value with its contrast ratio** against white and `--bone`, so it can
   be added to `test/contrast.mjs`'s gated set without re-deriving it.
3. The empty / absent / degraded state, wherever one exists.
4. One line on what you decided *not* to do and why, where you rejected an obvious option.

Two things that apply to §3.5–§3.7 in particular, because they change existing behaviour rather
than adding to it:

5. **Name what you are removing.** §3.6 and §3.7 both delete affordances that work today — an
   in-flow form, a dock, a `+`/`✓` toggle. Say what goes and what replaces its job. A design that
   silently loses a capability costs more to review than one that says "this feature dies, here is
   why".
6. **Say which of the seven you would ship first**, if they cannot all be built at once. You have
   seen the whole set; the owner would value the ordering.

## 5. What NOT to do

- Do not restyle screens outside these seven decisions. The rest of the app is shipped and reviewed.
- Do not replace the native `<select>` with a custom listbox (§3.5). The native picker is the right
  control on a phone; you are designing its closed state.
- Do not redesign the Destination tab bar itself (§3.7). Which tabs a stop and a place each show is
  settled and shipped — the Nearby *panel* is what is open.
- Do not introduce a component library, a second type scale, or a second palette.
- Do not reuse `--jade`, `--amber` or `--danger` for a new meaning.
- Do not rely on hue alone to carry meaning.
- Do not design a loading skeleton for the image slot. Absent is a permanent state here, not a slow
  one.
