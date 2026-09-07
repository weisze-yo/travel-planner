# Brief for Claude Design — Travel Planner, four presentation decisions

**Status: DRAFT for the owner to review before sending. Do not act on this yet.**

You are designing inside an app that already exists and already has a voice. Nothing here is a
greenfield screen. Four things need a visual decision; everything else in the app should look
untouched afterwards.

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
new hue. There is precedent: a five-colour set was added for the stop-summary labels, chosen to sit
in the cool arc the palette leaves empty, and it stays out of jade/amber/danger territory:

```
--sum-do #26327A (231°)  --sum-eat #7C2F72 (308°)  --sum-see #6A4FA8 (258°)
--sum-buy #1A7396 (197°) --sum-snack #B23F68 (339°)
```

### The accessibility bar — this is gated in CI, not advisory

`test/contrast.mjs` computes real WCAG ratios from the hex values and **exits non-zero** if any pair
introduced by a session drops below **AA 4.5:1**. Every new foreground/background pair you propose
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

## 3. The four decisions

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
genuinely different in kind (one is about photographs, one is about comfort), and they are the single
biggest piece of finished content the app is currently hiding.

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

### 3.4 Where a full-text search box lives

**Not yet built, and the mounting point is genuinely open.** One box over 688 records (532 places +
60 must-see + 96 shopping), matching English and Japanese names.

The two candidate homes both have problems:

- `nav.js` has a **fixed five-entry tab bar** — Map · Plan · Shop · Prep · Log. A sixth tab changes
  the whole bar's rhythm.
- `strip.js` is a **single-slot ranked warning strip** above the tab bar, showing one thing at a
  time (a reminder, an offline warning). A permanent search box would occupy the slot the warnings
  need.

**Please decide** where search is invoked from and what the result list looks like. A result row must
show: record name, Japanese name if present, `Day N · Stop name`, and which kind it is (place /
must-see / buy). Retired records must be visibly marked so a searcher is not sent to a hotel the
group is no longer staying at.

---

## 4. What to deliver

Artboards at **375 px** (the design width; the app is phone-first). For each of the four:

1. The proposed treatment, in context — inside a real screen, not floating on a blank artboard.
2. **Every new colour as a hex value with its contrast ratio** against white and `--bone`, so it can
   be added to `test/contrast.mjs`'s gated set without re-deriving it.
3. The empty / absent / degraded state, wherever one exists.
4. One line on what you decided *not* to do and why, where you rejected an obvious option.

## 5. What NOT to do

- Do not restyle screens outside these four decisions. The rest of the app is shipped and reviewed.
- Do not introduce a component library, a second type scale, or a second palette.
- Do not reuse `--jade`, `--amber` or `--danger` for a new meaning.
- Do not rely on hue alone to carry meaning.
- Do not design a loading skeleton for the image slot. Absent is a permanent state here, not a slow
  one.
