# notes8.md — Day 8, Tue 15 Sep 2026 · Narita Airport — Terminal 1 South Wing

One stop, one flight, and four things worth more than any amount of extra content:
the terminal is now **confirmed, not inferred**; **Narita Nakamise is airside, not
landside** (the seed had this the wrong way round); the **observation deck was rebuilt
and reopened in April 2026**; and the **tax-free story is settled** — nothing to claim
at the airport.

---

## 1. THE TERMINAL — CONFIRMED, from the airport's own site

**Confirmed: Terminal 1, SOUTH WING, 4F.** Not inferred any more.

Narita International Airport's own Detailed Airline Information page for Singapore
Airlines prints the allocation verbatim as:

> **T1 South Wing / 4F**

Source: <https://www.narita-airport.jp/en/flight/airline-search/sia/>

That is the airport operator publishing where the airline checks in — the strongest
source available short of a boarding pass, and it removes the single biggest failure
mode on this day. The `anchorStop` string `Narita Airport — Terminal 1 South Wing` is
therefore correct as written, and the Star-Alliance-allocation reasoning in the seed
summary can be retired: it happened to reach the right answer, but it is no longer the
evidence.

Cross-check, independently: Fa-So-La (NAA Retailing, the airport's own retail arm)
prints its Terminal 1 confectionery shop address as **「第1ターミナル 南ウイング3Ｆ
narita nakamise」** — i.e. the South Wing exists as a named, shopped, airside area on
3F under the 4F check-in hall, exactly as the layout requires.
Source: <https://narita-akihabara.jp/ja/store>

### What is still NOT confirmed

- **The counter island letter/number.** Neither Narita nor Singapore Airlines publishes
  which lettered island SQ uses in the 4F South Wing. A ground handler's group send-off
  map for the T1 South Wing 4F departure lobby shows **group reception at "K counter
  no. 16"** with a desk line answering 06:30–22:00, and lists Singapore Airlines among
  the carriers it serves — recorded in `essentials.tickets` as a handler-published
  detail, at medium confidence, not as an airport fact.
  Source: <https://www.airserve.co.jp/file/send-map/c-nrt1-s-20230822.pdf>
- **The gate / satellite.** The seed summary says "gates via Satellite 3". I could not
  verify that from any official page, and departure gates are not assignable in advance
  anyway. I have not repeated the claim in any record; `subRoutes[d8sr02airside]`
  explicitly says the walk to the gate is not costed because of it.
  (Note in passing: the Wikipedia "Wing Shuttle" article is about **Kansai**, not
  Narita, and states Narita's T2 people mover was decommissioned in 2013 — so there is
  no shuttle to budget for inside T1.)

---

## 2. THE 06:00 vs 06:30 HOTEL DEPARTURE DISCREPANCY — recorded, not resolved

Two sources, flatly incompatible:

| Source | What it says for Day 8 |
|---|---|
| **App** (`trip12_app_extract.md` §3 Day 8, authoritative) | `6:30am — Breakfast @ International Resort Hotel Yurakujo`. Then `Tour Bus to airport`, duration `~15 min`, **no clock time**. Then `Arrive Narita (NRT)`, **no clock time**. Then `10:55am SQ 637`. |
| **Briefing PDF** (`brief2.txt` line 501, Day 8 page) | `6.00am   Depart from hotel` — and nothing else on the page except "Welcome back to Penang". No breakfast row at all. |

They cannot both be true. A 06:00 departure means no 06:30 breakfast; a 06:30 breakfast
means no 06:00 departure. Per the source hierarchy the app wins, and the app's own
day-level solar reading (already finished, §2 of the brief) is computed for a **07:00
coach** — so the app-side reading of this day is: breakfast 06:30, coach about 07:00.

**Not resolved here.** Both are written into `essentials.transport` for the stop, with
the consequence spelled out rather than a verdict:

> a 06:00 departure lands the group at T1 about 06:20 — ninety minutes before the
> Singapore Airlines counter opens (07:55), before the 5F observation deck opens
> (06:30), and before breakfast could have happened at all.

At 06:20 the only things trading in T1 would be LAWSON on B1F (24 h), Capsule Marche on
5F (05:00) and the 5F SHIKISAI GARDEN area (05:00). The souvenir shops open 07:00
(Fa-So-La GIFT SHOP, DRUG BOX) and 07:30 (Tokyo Shokuhin Kan). So the 06:00 figure is
not merely early, it is **90 minutes of a 35-person group standing in an empty lobby**.

My reading, for the record and not written into the data as fact: 06:00 looks like a
leftover from a different flight time — it is the only time printed on that PDF page,
and the PDF's hotel names for other days are already known to be Trip 1's. **Ask the
agent to confirm the coach time before anyone sets an alarm.** Do not quietly adopt
either number.

---

## 3. TAX-FREE IS STILL AT-THE-TILL — confirmed, and there is nothing to queue for

**Confirmed against §2 of the brief. No contradiction.**

The Japan Tourism Agency (MLIT) consumption-tax-exemption site states it directly:

- Until **31 October 2026** — the export-goods-sales-place (免税店) system, where
  qualifying purchases are handed over tax-free and sold at the **tax-excluded price**:
  > 「2026年10月までの輸出物品販売場（免税店）制度では…消費税が免除され、税抜価格（免税）で販売することができます」
- From **1 November 2026** — the refund (リファンド) system, where the shop sells at the
  **tax-included** price and refunds the tax only after customs confirms export:
  > 「免税店は、購入者に対して、税込価格（課税）で免税対象物品を販売することとなります。○免税店は、税関確認情報…を確認後に購入者に消費税相当額を返金（リファンド）することとなります」

Source: <https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00019.html>

**15 September 2026 falls six and a half weeks before the switch.** Practical
consequences for this group, all written into the records:

1. **Everything bought in Japan on Days 1–8 was already tax-free at purchase.** There is
   **no refund counter at Narita** to find, queue for, or budget an hour against. Anyone
   arriving expecting to claim would waste the morning looking for a desk that does not
   yet exist.
2. What each shop *does* need is the **passport or the Visit Japan Web code at the
   cashier**, and the **¥5,000 minimum per shop per day**. Passports out on the coach,
   not buried in hand baggage.
3. This also matters *backwards*: a colleague who forgot to present a passport at
   Shisui on Day 7 cannot fix it at Narita on Day 8. Tax deducted at the till is
   deducted or it is not.

Recorded in `essentials.groupRate` and in the `outfitByStop.practical` line.

---

## 4. CHECK-IN TIMING, WORKED BACK FROM 10:55

All airline figures are Singapore Airlines' own airport check-in table, which lists
Tokyo Narita explicitly at **counter opens 3 hours before / counter closes 40 minutes
before** (the same as Haneda, Kansai, Chubu, Fukuoka and New Chitose — every Japanese
station on the table shares those figures).
Source: <https://www.singaporeair.com/en_UK/sg/travel-info/check-in/airport-check-in/>
(and the Japanese edition, <https://www.singaporeair.com/ja_JP/jp/travel-info/check-in/airport-check-in/>)

| Clock | Event | Source |
|---|---|---|
| 06:30 | Breakfast, California Restaurant — the restaurant's own opening minute | app + Day 7 worksheet |
| **07:00–07:10** | **Coach must be off the hotel forecourt** | derived; matches the day's existing 07:00 solar reading |
| 07:20–07:35 | Arrive T1 4F departure kerb, South Wing (20–25 min: the hotel quotes ~20, the app prints ~15) | Day 7 worksheet |
| **07:55** | **SQ counter OPENS** (3 h before 10:55) | Singapore Airlines |
| ~08:40 | Last bag tagged, 35 pax + 35 bags — allow 45 min at the counter | derived |
| 08:25–09:45 | Landside hour: 5F deck, footbaths, 4F shops (`subRoutes[d8sr01landside]`) | — |
| 08:55 | Narita's own "arrive at least two hours before departure" floor | <https://www.narita-airport.jp/en/airportguide/inter-dep/> |
| 09:45 | Be in the South Wing security queue | derived |
| 09:50–10:25 | Airside 3F omiyage run (`subRoutes[d8sr02airside]`) | — |
| **10:15** | **Check-in and baggage acceptance CLOSE** (40 min before) | Singapore Airlines |
| ~10:15–10:25 | Boarding a 7-hour widebody | derived |
| 10:55 | SQ637 departs | app |

**The realistic coach departure is 07:00–07:10, and 07:15 is the outside limit.**
Rationale: getting the group to the counter for its 07:55 opening is worth far more than
arriving earlier, because before 07:55 no bag can be dropped — SIA states counters will
not accept baggage before they open — and before 07:30 most of the shops are shut too.
Leaving at 07:00 puts 35 people at the head of the queue the minute it opens and still
leaves 80 minutes of hands-free time afterwards. Leaving at 06:00 buys nothing and costs
90 minutes.

Two caveats I could not close:
- **Group check-in.** Singapore Airlines publishes no separate group counter timing for
  Narita, so the 45-minute counter allowance is my estimate, not a quoted figure.
- **Security and immigration waits.** Narita publishes no live or typical wait time for
  T1 South Wing, so the 09:45 handover is a margin, not a measurement. Departure
  immigration for foreign nationals uses facial-recognition and automated gates, which
  is fast and stamp-free — Narita's departure-procedure page confirms they are available.

---

## 5. FINDINGS THAT CORRECT THE EXISTING DAY-8 RECORDS

These contradict the seed and the worksheet, not §2 of the brief. Written into the
batch by reusing the existing ids, with the correction stated in the `note` itself.

### 5a. Narita Nakamise is AIRSIDE on 3F — the biggest single error on this day

The seed, the worksheet and the stop summary all describe **「the 4F landside shopping
street — Narita Nakamise」** and instruct the group to *"do the souvenir run BEFORE
security"*. That is wrong, and it is the kind of wrong that sends 35 people to the wrong
floor with an hour to spare.

Two official sources place it airside:

- Narita's own shopping-area page for T1 lists exactly three retail zones, **all on 3F
  and all after security**: the Central Building zone, **"South Wing Narita Nakamise"**,
  and "North Wing NARITA NORTH STREET". Nakamise's own line reads *"Enjoy shopping and
  dining after security checks until boarding."* Hours typically 07:30–22:00.
  <https://www.narita-airport.jp/en/shop/malllist-t1/>
- Fa-So-La's store list gives its T1 shop's address as **「第1ターミナル 南ウイング3Ｆ
  narita nakamise / 営業時間：7:30～22:00」**.
  <https://narita-akihabara.jp/ja/store>

**The good news is that this is better, not worse.** Nakamise is in the *South Wing* —
the group's own wing — so it sits directly on the path from the SQ counter to the gate.
The whole omiyage plan simply moves to after immigration, which is where
`subRoutes[d8sr02airside]` now puts it. The genuinely landside sweets shops in T1 are
different and named separately in this batch:

| Shop | Where | Hours | Side |
|---|---|---|---|
| Fa-So-La GIFT SHOP Terminal 1 South Wing | **4F South Wing** | **07:00–20:00** | before security |
| DRUG BOX Terminal 1 South Wing | 4F South Wing | 07:00–21:00 | before security |
| TOKYO SHOKUHIN KAN OMOTASE-DOKORO | 4F Central Building | 07:30–21:00 | before security, TAX FREE |
| McDonald's | 4F Central Building | 06:30–21:30 (L.O.) | before security |
| Capsule Marche | 5F Central Building | 05:00–23:00 | before security |
| LAWSON | **B1F** | **24 hours** | before security |
| Narita Nakamise / Fa-So-La TAX FREE AKIHABARA | **3F South Wing** | 07:30–22:00 | **AFTER security** |
| Fa-So-La DUTY FREE Terminal 1 South Wing | 3F South Wing | 07:30–21:00 | AFTER security |
| IPPUDO | **3F** Central Building | 07:30–20:30 (L.O.) | **AFTER security** |

All from the airport's own per-shop pages.

### 5b. "Nothing trades before 07:30" is wrong

The worksheet's mustEat line says *"If you arrive before 07:30 the only thing trading is
the 5F Capsule Marche gachapon shop (05:00–23:00) and the vending machines."* Capsule
Marche's hours are right — but **McDonald's on 4F opens 06:30**, **Fa-So-La GIFT SHOP
and DRUG BOX on 4F South Wing both open 07:00**, and **LAWSON on B1F never closes**.
Corrected in place on place id `61bc7598f85b`.

### 5c. The observation deck was closed for a year and reopened in April 2026 — new

This is the most substantial *new* fact of the day and none of the existing records know
it. The T1 5F deck **closed completely on 7 April 2025** and reopened **Thursday 9 April
2026** as **GARDEN WALK**, inside a rebuilt 5F called **SHIKISAI GARDEN -Seasonal
colors-**. From Narita's own press release and topics page:

- **5F area opens 05:00**; **展望デッキ「GARDEN WALK」 opens 06:30**. Free.
- **Three hot-water footbaths** on the north side of the deck, each about 5 m × 0.8 m,
  one scented with seasonal bath salts — **free**.
- A **"Mountain Deck"** raised about 2.5 m, the first spot at Narita giving an
  unobstructed frame; the old mesh fence replaced by **wire spaced about 7 cm**, so a
  phone lens passes through it. Flat-deck fence height 3 m.
- Relaxation rooms 茶の間 / 居の間 / 書の間 — 130 free seats round the 4F–5F atrium —
  **open about 13:30**, and **Kinder Platz** (paid) at 10:00.
- A renewed **SKY FOOD COURT**; the release does not publish tenant hours.

Sources: <https://www.narita-airport.jp/ja/topics/shikisaigarden/> ·
<https://www.narita-airport.jp/files/028434d2d0caf4aac07745bd72721745ca85c081d5ffe9768aaa136ac142120a>
(EN) · <https://www.narita-airport.jp/files/d12c82561c143d96de02834048fcfd5f1f7b1fa202bf0bb32fc891b408268f6f> (JA) ·
<https://www.traicy.com/posts/20260407367420/> (dimensions) ·
<https://www.arukikata.co.jp/tokuhain/376724/> (footbath is free)

**The deck is open at 08:30.** The 06:30 opening is official. The **21:00 close** and
the **1 Apr–30 Sep 06:30 / 1 Oct–31 Mar 07:00** seasonal split are *not* on any current
official page — they are the long-standing pre-renovation published hours and I have
flagged them as such on every record that uses them. 15 Sep sits inside the summer
window either way, so the opening time is not at risk.

**The 130-seat lounge is a trap on this itinerary.** It is the obvious answer to "where
do 35 people wait for an hour" and it does not open until about 13:30. Recorded as its
own place record (`d8t1shikisairest`) precisely so the app says so rather than staying
silent.

### 5d. T1 is not a 24-hour building

Narita states most floors run **05:00–24:00** and that **only 1F and B1F are available
24 hours**; T1's 24-hour store is LAWSON on B1F. Relevant only under the PDF's 06:00
scenario, but relevant.
<https://www.narita-airport.jp/en/access/early-morning/>

### 5e. ROYCE' nama chocolate — the honest version

The worksheet says *"Buy LAST, take the ice pack, and put it in HAND baggage."* The
first and third parts are right. The middle part oversells it, and the shop is not where
the worksheet implies.

- ROYCE' prints **要冷蔵 — 冷蔵庫（10℃以下）で保存してください** with roughly a month's
  shelf life; the Au Lait box is **¥1,215 for 20 pieces**.
  <https://www.royce.com/goods/detail/?o_no=2054>
- **Narita 10:55 → Penang 20:35 is about eleven hours plus the transfer home.** No
  supermarket ice pack holds 10 °C for that. It arrives soft. Not spoiled — soft. The
  record now says that plainly and offers the non-refrigerated ROYCE' bar or potato-chip
  chocolate as the alternative for anyone who wants it pristine.
- Ice packs and gel packs **are** allowed in hand baggage and are not subject to the
  100 ml rule — the briefing itself says so (brief1.txt line 167).
- **Where:** ROYCE's own shop list places its Narita stockists in the **airside gate and
  duty-free areas** (Fa-So-La and JAL PLAZA gate shops), and **ANA FESTA lists Narita
  stock only at the Terminal 2 lobby shop** — which this group never reaches. So the
  buy is airside, at Fa-So-La on 3F South Wing. No official page names the specific T1
  unit holding refrigerated stock, so the record is `confidence: medium` and says so.
  <https://www.royce.com/brand/shop/> · <https://www.anafesta.com/airports/nrt/23_0735/>

### 5f. Prices for the four existing `estimate: null` shopping records, and four new ones

All from makers' or airport retailers' own pages, never an aggregator:

| Item | Price | Keeps? |
|---|---|---|
| ISHIYA **Shiroi Koibito** 18 pc / 24 pc | **¥1,320 / ¥1,760** tax-free (Fa-So-La's own list) | Room temp, rigid tin — arrives exactly as it left. The safe heavy buy. |
| **Tokyo Fugetsudo Gaufre** 12 wafers / 5 / 16 (twin tin) | **¥1,620 / ¥594 / ¥2,592** | **180 days** from manufacture — the longest here. Wafers snap: carry the tin FLAT. |
| **Tokyo Banana** 4 / 8 / 12 pc | **¥691 / ¥1,296 / ¥1,944** — identical at the maker, JAL PLAZA and ANA FESTA, so no airport markup | Crushes; fresh-cream sponge, days not weeks. Rides on top of the hand baggage. |
| **ROYCE' Nama Chocolate [Au Lait]** 20 pc | **¥1,215** | 要冷蔵 10 °C. Arrives soft. Hand baggage with the ice pack. |
| **ISHIYA Maneki-neko Chocolate** 24 pc — **Narita exclusive, launched at T1 only** | **¥1,400** tax-free | Room temp. The only thing on the list unbuyable anywhere else. |
| Japanese whisky, duty free | indicative ¥6,000 | Cabin only, bought airside. **1 litre per adult** for Malaysia. |

Sources: <https://narita-akihabara.jp/ja/food-goods/post-000090> ·
<https://www.tokyo-fugetsudo.jp/products/lineup/gaufres> ·
<https://www.tokyobanana.jp/products/banana.html> ·
<https://jalplaza-airport.jalux.com/product/detail/4534315000029/> ·
<https://www.anafesta.com/airports/nrt/23_0177/>

The maneki-neko "T1 only" line is dated **February 2024** on Fa-So-La's page and says
expansion to T2 and T3 was planned, so the exclusivity may have widened — flagged on
the record.

---

## 6. MALAYSIAN CUSTOMS — the worksheet's 1-litre claim confirmed, plus two additions

The worksheet's mustBuy line says *"In the liquor hall, remember Malaysian customs
allows 1 litre per adult."* **Confirmed** from the Royal Malaysian Customs Department's
own traveller guide, which also adds two things the worksheet does not have:

- **Intoxicating liquor: "Not exceeding 1 litre in total."** ✔ as claimed.
- **Cigarettes and tobacco products are EXCLUDED from the traveller exemption
  altogether** — listed among the goods that do not qualify. There is effectively **no
  duty-free cigarette allowance into Malaysia**. Anyone loading up at the tobacco wall
  in Fa-So-La DUTY FREE is buying dutiable goods.
- **Other goods: total value not exceeding RM1,000** by air (RM500 by land/sea), plus
  food preparations to RM150, 3 pieces of new apparel and 1 pair of new footwear.
  RM1,000 is roughly ¥30,000 — reachable by a serious omiyage shopper, so it is written
  into the Nakamise shopping record.

Source: <https://www.customs.gov.my/en/individu/pengembara/travelers-guide>

I could not confirm the Malaysia row of Singapore Airlines' own KrisShop duty-free
allowance PDF — the table's rows do not align in extraction — so the Malaysian
government source is the one used.

---

## 7. SINGAPORE AIRLINES POWER BANK RULE — new, effective before this flight

The briefing PDF's battery rule (*"All Battery items must be hand-carried on board.
Prohibited in Check-in Baggage… Power Bank less than 20,000mAh"*, brief1.txt lines
490–501) is correct but no longer complete. Singapore Airlines' own advisory imposes
extra rules **from 00:01 SGT on Wednesday 15 April 2026** — five months before this
flight, so they apply:

- **Maximum two power banks** per passenger.
- **Cabin baggage only; never checked.**
- Up to **100 Wh** without approval; 100–160 Wh needs approval; **above 160 Wh
  prohibited**. (20,000 mAh at 3.7 V ≈ 74 Wh, so the briefing's threshold sits safely
  inside the airline's.)
- Must be **in the seat pocket or under the seat in front — NOT in the overhead bin.**
- **Must not be charged from the in-seat power outlet or USB port, and must not be used
  to charge any device, during the flight.**
- Wider limits on the same page: max 15 devices, max 20 spare batteries per passenger.

Sources: <https://www.singaporeair.com/en_UK/sg/corporate/newsroom/newsalert-listing/advisory-on-the-carriage-of-power-banks-on-board-sia-flights-/> ·
<https://www.singaporeair.com/en_UK/sg/travel-info/baggage/baggage-restrictions/>

Written into `essentials.tickets` and into `outfitByStop.practical`, alongside the
opposite-direction rule the briefing is explicit about: **liquids over 100 ml must go
into the CHECKED bag** — which on this day means *before the counter closes at 10:15*,
because there is no second chance afterwards. Both of Narita's designated
"zipper transparent bag" stores in T1 are named in the batch (LAWSON B1F, 24 h; DRUG BOX
4F South Wing, 07:00) for the under-100 ml bag.

---

## 8. COORDINATES

The GSI government geocoder resolved Terminal 1's own address:

```
千葉県成田市古込1-1  →  [140.386032, 35.773689]   (title: 千葉県成田市古込１番地)
```

Cross-checks: `千葉県成田市三里塚` resolves to 35.751087, 140.387344 — well south, in the
T2/T3 area, so 古込 is indeed T1's block. POI-style queries (`成田国際空港`,
`成田国際空港第1旅客ターミナルビル`, `成田市さくらの山`) return only city-level fallbacks,
as expected.

**Promoted to `verified`:**

- `61bc7598f85b` T1 landside food floors — **was 35.770461, 140.392564 (approximate)**,
  now **35.773689, 140.386032**. The old longitude sat about 600 m east of the terminal,
  out over the apron.
- `67755765f105` and mustSee `64bc38b9a950` (the 5F deck) keep the seed's already-verified
  35.771944, 140.386389, which agrees with the geocoded T1 point to within ~200 m and is
  the more specific of the two.

**A note for whoever imports this batch:** the STOP record `184f9cf0f25a` carries
**35.772, 140.3929**, and mustSee `c7c29543a209` carried the same. That longitude is the
same ~600 m easterly error. I have moved the mustSee to the geocoded T1 point and said
so on the record; **the stop's own coordinate is outside this batch's schema and still
needs fixing** to about 35.7725, 140.3862.

**Left `approximate` on purpose:** every in-terminal shop unit. The geocoder resolves the
building, not a floor or a shopfront, and Narita publishes no per-unit coordinates.
Each of those records says exactly that in its `confidenceNote` rather than dressing a
building-level point up as verified.

---

## 9. IMAGES

**None attached; the `images` key is omitted from every record.** Commons and Openverse
are unreachable from this session, and although Narita's press pages carry good
photography of the new deck and footbaths, none of them states a reuse licence. Per §3g
and rule 7 of the brief, an image search link is the acceptable substitute and an
unlicensed copy in someone's Firebase Storage is not.

---

## 10. Nothing here contradicts §2 of the brief

The one §2 item that touches Day 8 — **"Tax-free: still at-the-till until 1 Nov 2026"** —
is **confirmed** against the Japan Tourism Agency's own page (§3 above), including the
exact Japanese wording of both the old and new systems. No other §2 correction is in
scope for this day, and none of my findings pushes back on one.

## 11. Anything else unverified

- The **21:00 deck close** and the Apr–Sep/Oct–Mar seasonal split (opening time is official).
- **SKY FOOD COURT tenant hours** — the airport publishes none; the tenant names
  (Ippudo, Kineya, Goemon, a Thai counter) come from a visitor review, and the T1 Ippudo
  the airport *does* list is 3F airside.
- **Capsule Marche's coin denominations** — not published; hours and floor are official.
- **Footbath hours and towel policy** — not published; the deck's 06:30 is assumed and
  the "free" comes from a press visit, not an official page.
- **The counter island letter**, the **group counter timing** for 35 people, the
  **security/immigration wait**, and the **gate/satellite**.
- The **¥5,000 Nakamise budget**, the **¥6,000 whisky** and the **¥150 zip bag** are
  planning figures, labelled as such on their records.
- **Tokyo Banana's shelf life** — the maker publishes none, so "days not weeks" is
  inferred from the product type.
