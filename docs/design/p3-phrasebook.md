# P3 — Phrasebook: the card you hold up

**Date:** 29 Sep 2026 · **Verified against** the working tree on `claude/intelligent-pasteur-ebuo53`, read this session
**Status:** design, for review. **Nothing implemented. No application code changed.**
**Artboard:** *Harbour Garden* rev 5, plate 08 (Pocket — Phrases).
**Canonical:** this document for the phrase record, the show-card and the content pipeline.
**Depends on:** `p3-information-architecture.md` — D-16 (Pocket hub), D-23 (emergency is brown).

**Source read this session:** `src/persist.js` `KINDS` 23 · `src/share.js` `SHARED_KINDS` 69 / `PRIVATE_KINDS` 72 · `web/sw.js` `ASSETS` 30–81 · `src/screens/prep.js` · `web/css/app.css` type scale · `docs/design/multilingual-warning-strip-design.md` (the existing CJK precedent) · `docs/design/transition-audit.md` item 12 (the CJK robustness pass, still open).

**Fixed foundations, not reopened:** it must work offline · no paid APIs · no stock content invented to fill a screen.

**Out of scope, deliberately:** translation of arbitrary text · speech recognition · camera translation · any network call at all.

---

## 1. What exists today

Nothing. There is no phrase, no language field on a trip, and no screen. This document is the only one of the six with no existing code to correct.

One thing does exist and matters: **the app has already solved rendering non-Latin text at 390px** — `multilingual-warning-strip-design.md`, and the `nameJp` field that Trip 12's research carries. The typography problem is half solved; item 12 of the transition audit (the CJK robustness pass) is the other half, and this feature is what finally makes it non-optional.

---

## 2. The principle

> **The phrasebook's job is not to teach you the language. It is to be held up.**

Every decision follows from imagining the actual moment: you are standing in a shop, there is a queue, the shopkeeper does not share a language with you, and you have about four seconds.

**D-1. The show-card is the screen's centre, not a detail view.** The selected phrase renders in the destination's script at 28–32px on a brown card, with the romanisation small underneath. It is legible at arm's length across a counter. Everything else on the screen is how you choose what goes on it.

**D-2. The romanisation is for you, the script is for them.** Which is why the script is large and the romanisation is 11.5px mono underneath it. Reversing that — as most phrasebook apps do — optimises for the wrong reader.

**D-3. No audio, and no pronunciation guide beyond the romanisation.** Audio needs files, files need size, and a phone held up in a noisy market is a better tool than a phone played at someone. This is a deliberate omission, not an oversight.

**D-4. It never touches the network.** Not for content, not for a rate, not for a font. The phrasebook is the single most likely screen in the app to be used with no signal, in a country where roaming is expensive.

---

## 3. The content

**D-5. Phrases ship as static content, not as trip data.** They are not a Firestore kind. A language's phrases are the same for everyone, and per-trip copies would mean 34 duplicated records per trip for no gain.

```
web/content/phrases/ko.json
{
  "language": "Korean", "code": "ko", "script": "hangul",
  "groups": [
    { "id": "shopping", "label": "Shopping", "phrases": [
      { "id": "how-much", "en": "How much is this?",
        "local": "이거 얼마예요?", "roman": "i-geo eol-ma-ye-yo",
        "note": "Point at the thing." }
    ]}
  ]
}
```

**D-6. Each language file is precached by `sw.js`.** It joins `ASSETS`, and the build gate added in Phase 0 — which fails when what is emitted does not match what `sw.js` lists — covers it automatically. This is the single reason the offline promise holds for this feature without new machinery.

**D-7. Only the trip's languages are loaded, but all shipped languages are precached.** A file is a few kilobytes; the cost of getting this wrong is a screen that does not open in a country you did not plan to be in.

**D-8. Six groups, in this order:** `Shopping · Getting around · Eating · Staying · Meeting people · If it goes wrong`. The order is by how often you will need it, not alphabetically and not by grammar.

**D-9. `If it goes wrong` is last but styled differently** — its chips are pink-outlined, matching the emergency language in `p3-people-and-coordination.md`. You should be able to find it by colour while panicking.

---

## 4. The screen

```
[Money] [Phrases] [Must] [Log]        ← Pocket's chip row

┌──────────────────────────────┐
│ 이거 얼마예요?                │      ← brown card, 28px
│ i-geo eol-ma-ye-yo            │
└──────────────────────────────┘
Hold it up. Readable at arm's length, works with no signal.

SHOPPING
(How much?) (Too expensive) (Card, please) (Tax refund?)
GETTING AROUND
(Where is the toilet?) (Which exit?) (Take me here)
IF IT GOES WRONG
(I need help) (Call the police) (I am lost)     ← pink outline
```

**D-10. Tapping a chip puts that phrase on the card.** One tap, no navigation, no sheet. The card is always populated — the screen is never empty.

**D-11. Up to six phrases can be pinned to the card at once**, stacked. A conversation is rarely one sentence, and scrolling to find the next one while someone waits is the failure this prevents.

**D-12. No drawing behind this screen.** Pocket's other sections carry the trip's illustration at 15%; Phrases does not. A stranger has to read it, so the screen gets out of the way. Stated because it is the one place the design's own charm is deliberately suspended.

**D-13. The card is the brightest-contrast element in the app** — brown on cream, 9.5:1 — and it does not dim, animate or time out. It survives a screen-brightness change and a rotation.

---

## 5. Content production

**D-14. Phrase files are generated and QA'd by a `tools/` command**, in Python, alongside the research pipeline. Same language, same place, same rule that it never ships to a phone.

**D-15. Every phrase is checked by a native speaker or a cited source, and the file records which.** A phrasebook that is confidently wrong is worse than no phrasebook — you will say the wrong thing with conviction. Each group carries `source` and `reviewedBy`.

**D-16. The QA command checks four things** before a file may be committed:

1. every phrase has `en`, `local` and `roman`
2. `local` contains characters in the declared script
3. no phrase's `local` exceeds the length that fits two lines at 28px in a 358px card — measured, not guessed
4. the group ids match the six in D-8

**D-17. Politeness level is fixed per language and stated in the file.** Korean has several; the file uses the polite `-yo` form throughout, because a traveller who does not know the system cannot choose between them and the polite form is never wrong.

---

## 6. The CJK obligation this finally forces

Item 12 of `transition-audit.md` — the CJK robustness pass — has been open since the transition and deferred twice. This feature makes it mandatory: the screen exists to render Korean, Japanese and Chinese text at large sizes.

**D-18. The pass happens before this feature ships**, and covers: line-breaking without a space character, the 390px width with no horizontal overflow, font fallback when the system font lacks a glyph, and mixed-script lines (`Coach 4, seats 3A–3C · 4호차`).

---

## 7. Test obligations

1. **Every shipped phrase file validates** against the `tools/` QA rules, in `pytest`.
2. **The phrases screen renders with the network down** — added to `offline-cold-boot`.
3. **CJK at 390px does not overflow**, for the longest phrase in each shipped language.
4. **Six pinned phrases fit the card** without the screen scrolling past the chip row.
5. **`sw.js` lists every phrase file**, enforced by the existing build gate rather than a new check.
6. **Phrases are not a Firestore kind** — asserted, so a later session does not add them as one.

---

## 8. Decisions

1. **D-1** The show-card is the screen's centre, at 28–32px.
2. **D-2** The script is large for them; the romanisation is small for you.
3. **D-3** No audio and no pronunciation guide beyond romanisation.
4. **D-4** No network access of any kind.
5. **D-5** Phrases are static content, not a Firestore kind.
6. **D-6** Language files join `sw.js`'s precache, covered by the existing build gate.
7. **D-7** All shipped languages are precached; only the trip's are loaded.
8. **D-8** Six groups, ordered by how often they are needed.
9. **D-9** `If it goes wrong` is pink-outlined, findable by colour.
10. **D-10** One tap puts a phrase on the card; no navigation.
11. **D-11** Up to six phrases pin to the card at once.
12. **D-12** No illustration behind this screen.
13. **D-13** The card is the highest-contrast element in the app and never dims.
14. **D-14** Phrase files are generated and QA'd by a `tools/` command.
15. **D-15** Every phrase is source-checked, and the file records by whom.
16. **D-16** The QA command enforces four rules before commit.
17. **D-17** One politeness level per language, stated in the file.
18. **D-18** The CJK robustness pass happens before this ships.
