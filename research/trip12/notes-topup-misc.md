# notes-topup-misc.md — verifying candidates harvested from `slm37102/tohoku-trip-map`

**Session: 4 September 2026.** Batch `topup-misc.json` — 12 `places`, 1 `mustSee`, 3 `shopping`.
Validator: **0 errors, 0 warnings.** No `essentials` block (the existing batches carry them).
No `removedFromDay` manifest needed: every `anchorStop` used here is currently ACTIVE.

**The source is Trip 1, 15–22 August 2026.** Nothing below is recorded on its say-so. Every
date-tied and weekday-tied fact was re-derived for **Trip 12's** dates:

| Trip 12 date | Weekday | Their trip's equivalent | Consequence |
|---|---|---|---|
| Wed 9 Sep (Matsushima) | Wednesday | Sunday 16 Aug | Yakigaki House runs the WEEKDAY clock 10:00–15:00, not the 09:00 weekend one |
| Thu 10 Sep (Ginzan) | Thursday | Monday 17 Aug | no weekday closure in play |
| Fri 11 Sep (Kinugawa) | **Friday** | Tuesday 18 Aug | Hakkaisan is **closed Mondays** and Sacchan **closed Sundays** — both open on a Friday |
| Mon 14 Sep (Tsukiji, Shisui, Yurakujo) | **Monday** | Friday 21 Aug | Tsukiji trades; Tomisatoya opens **17:00 not 13:00**; Ishii is 無休 so a Monday is fine |

September 2026's public holidays are the **21st and 23rd** — neither day 7 nor day 8 is a holiday,
which is what keeps Tsukiji's and Marutake's holiday closures out of play.

**Sport content dropped as instructed.** No gyms, no running routes, no gear advice. Ishii Sports is
kept because the user asked for it, and it is filed as an ordinary `category: "shopping"` shop
record — hours, address, transit, reachability. Nothing about climbing or equipment.

---

## 1. Verdicts, candidate by candidate

### Matsushima — Wed 9 Sep (market 13:18–14:18, cruise 16:00–17:00)

#### Abe Kamaboko / 阿部蒲鉾店 — **VERIFIED, and NEW (id `tmisc-abe-matsu`)**
Their claim: *"Grilled sasa-kamaboko by the pier — Abe Kamaboko allows you to grill your own."*

Both halves stand up, and the shop is genuinely new to us.

- **We already hold an Abe Kamaboko — the WRONG ONE for Matsushima.** `d2w30snd` in
  `expand-d12.json` is 阿部蒲鉾店 **本店** on Clis Road in **Sendai** (中央2-3-18), anchored to
  Sendai Station. That is a different branch 60 km away. Checking by name alone would have produced
  a false "already have it".
- The Matsushima branch is **阿部蒲鉾店 松島寺町店**, and it is on Abe's own store list:
  「〒981-0213 宮城郡松島町松島町内58」 with 「手焼き笹かま体験 … 1枚300円(税込)/所要時間:10分程度
  ※予約は不要です。閉店の30分前位までにお越しください。」
- **"By the pier" is right.** GSI resolves 松島町内58番地 to `38.370247 / 141.060349`. Measured
  against records we already hold: **95 m** from Pensée at Matsushima Rikyu Umi-no-Eki (which our
  own note puts ~200 m from the pier), **196 m** from Matsukama Sohonten, **347 m** from the fish
  market. It is on the waterfront, roughly 3 minutes from the cruise pier.
- **The operationally valuable bit they missed.** We already hold Matsukama's hand-grilling counter
  (`d2god001matsukama`) at ¥400 a stick — with the rule that **parties of 10 or more must book**.
  Abe's is ¥300 and **予約不要**. For 35 Malaysians with 60 minutes, that is the difference between
  a phone call weeks out and walking in.
- Hours **9:00–18:00**, ~15 free parking spaces — from Miyagi Navi, *not* the operator, and **no
  closing day is published anywhere**. Filed `medium` for that reason.
- Price disagreement recorded, not hidden: Abe's own page says **¥300 tax-incl**, Miyagi Navi says
  **¥250**. Took the operator's ¥300.
- Sources: <https://www.abekama.co.jp/store> · <https://matsushima.miyaginavi.jp/shopping/907.html>

#### Yakigaki oyster hut — **ALREADY HAVE IT, corrected (id `e5bb2ba00c92`)**
Their claim: *"the yakigaki oyster hut" at the fish market, and "all-you-can-eat grilled oysters"
near the cruise pier.*

Both descriptions are the **same single venue**, and we already hold it as
**別館 焼がきハウス** at `38.372082 / 141.063568`, `confidence: high`. The market and the cruise
pier are ~250 m apart, which is why their two mentions read as two places.

Confirmed again on the operator's own page: 食べ放題 is real, weekdays 10:00–15:00 (weekends/holidays
09:00–15:00), 「焼がき食べ放題（45分）3,500円」 / 「+かきご飯とかき汁付き 4,000円」. **Wed 9 Sep takes
the weekday clock**, so the grills are lit at 13:18.

**Two operator facts nobody had recorded, and both bite a 35-person group** — this is why the
correction was worth emitting:

1. 「※お席のご予約は承っておりませんのでご了承願います」 — **seats cannot be booked at all.** 35
   people walk in and queue for a 45-minute sitting inside a 60-minute stop.
2. 「牡蠣の育成の状況により、時期が異なる場合もございますので、お問い合わせの上ご来店ください」 —
   phone ahead, because 9 September sits outside the Nov–Mar season the operator itself flags.

Source: <https://www.sakana-ichiba.co.jp/eat/house/>

### Ginzan Onsen Street — Thu 10 Sep, 09:30–11:30

#### Haikara-san Dori curry bread — **ALREADY HAVE IT, corrected (id `d3shopcurry1`)**
Their claim: *"Curry bread from Haikara-san Dori."*

**They got the shop name right, and we had it as a product only.** はいからさん通り
("Haikara-san-dōri") is **a shop name, not a street** — 4travel lists it as a facility, and
大正ろまん館 refers to it as a business. The product is **はいからさんのカリーパン**, which is what our
record is called, so the name we hold is also correct. Nobody was wrong; the two were describing the
shop and the product.

**What is new and useful.** Our record said only that the line moved to Meiyu-an. Two better sources
say it is at **two** places:

- Yamagata Prefecture's official tourism site: 「購入は明友庵又は大正ろまん館でどうぞ」.
- 大正ろまん館's own post: 「大正ろまん館では、現在移転準備中のはいからさん通りに変わり、
  「はいからさんのカリーパン」を販売しています」 (posted 8 July 2022, so the relocation may since have
  completed — flagged in the `confidenceNote`).

**Why that matters to us specifically: 大正ろまん館 is where our coach parks.** We already hold it as
`3bc02245859e` "Taisho Roman-kan coach lot". It opens **09:00**; the group arrives **09:30**. So the
curry pan is buyable at the coach lot, without spending street time on it — which is a different
plan from the one our record implied. No price is published by either outlet, so the ¥250 stays a
reported figure.

Sources: <https://yamagatakanko.com/attractions/detail_8488.html> ·
<https://www.ginzan-taishoromankan.jp/information/…> · <https://4travel.jp/dm_shisetsu/10946947>

#### "Warashiyu" vs 和楽足湯 Waraku Ashiyu — **SEE §3. Corrected (id `70e89c03f9e4`).**

### Tsukiji Outer Market — Mon 14 Sep, 10:50–11:50

#### Yamachou / 山長 tamagoyaki — **ALREADY HAVE IT (`1dff34b846e2`), claim VERIFIED, nothing to correct**
#### Marutake / 丸武 tamagoyaki — **ALREADY HAVE IT (`8b487a57262e`), claim VERIFIED, nothing to correct**

Their claim: *"Tamagoyaki from Yamachou or Marutake to eat now."* True, and both are already held at
`high` confidence with the market association's own hours. Re-checked at source this session and
both records are exactly right:

| Shop | Address | Hours | Closed | Mon 14 Sep |
|---|---|---|---|---|
| 築地 山長 | 築地4-10-10, 03-3248-6002 | **6:00–15:30** | 「なし」 — no closing day at all | open |
| 丸武 | 築地4-10-10, 03-3542-1919 | **4:00–14:30** | 日曜（1月、8月）・祝日・市場休市日 | open |

**Coordinate cross-check, since both our records carry the identical pin:** that is not a copy-paste
error. Both shops share the address 築地4-10-10, and GSI resolves 東京都中央区築地4-10-10 to exactly
`35.665108 / 139.77002` — the value already in both records, to six decimal places. Verified as-is.

The only thing worth saying that their claim does not: Marutake is **four hours into its day** by
10:50 and shuts at 14:30, while Yamachou never closes. If one item has to be guaranteed, it is
Yamachou's 串玉.

Sources: <https://www.tsukiji.or.jp/shoplist/cat-c/cat-10/466/> ·
<https://www.tsukiji.or.jp/shoplist/cat-c/cat-10/135/>

#### Knife engraving — **REJECTED as stated. Corrected onto the existing record (id `1c0aa6c25b8c`).**
Their claim: *"several shops engrave your name for free."*

**Half true, and the wrong half is the half that matters for a 60-minute stop.**

- **The free engraving is real — at exactly one shop.** 築地有次's own retail channel:
  「【無料でお名前を入れられます】・築地有次の職人が手で入れます・英語、漢字、カタカナなど入れられます」.
  Free, hand-cut by their own craftsmen, Latin or kanji or katakana.
- **"Several" is wrong.** The Tsukiji Outer Market association's own directory lists **six** knife
  shops — 東源正久, 杉本刃物, 築地有次, 築地子の日, 築地正本, 藤次郎ナイフギャラリー築地店 — and
  **not one of the six listings mentions 名入れ at all.** Tojiro's own 名入れ page and Aritsugu's own
  site are both robots-blocked from here (retried once each), so no operator page could be read
  beyond Aritsugu's retail channel.
- **How long it takes: nobody publishes a turnaround.** The only procedural sentence found is
  「ご注文後、弊社からお名前入れの件で連絡します」 — they contact you afterwards. That reads as a
  follow-up conversation, not a while-you-wait service.
- **Answer to the question actually asked:** a 60-minute stop **cannot** be planned around
  engraving. It is a maybe-ask-at-the-till, not a scheduled item. Recorded that way.
- Bonus defect found in passing: the market's own site **contradicts itself** on Aritsugu's hours.
  The Japanese page gives 6:00–15:00 closed 市場休市日; the **English** page gives 5:30–15:00 closed
  「Sundays, National holidays, Sometimes Wednesdays」. Both leave Mon 14 Sep open, so it costs us
  nothing — but it is on the operator's own site, in two languages, and worth knowing.
- Sources: <https://www.tsukiji-go.jp/items/49028677> ·
  <https://www.tsukiji.or.jp/shoplist/cat-f/cat-20/> ·
  <https://www.tsukiji.or.jp/english/shoplist/cat-f/cat-20/242/>

### Kinugawa — Fri 11 Sep (arrive 18:20, kaiseki 18:30/19:00, coach 08:30)

**Every distance below was re-measured from the NEW hotel.** Hana no Yado Matsuya is at
〒321-2521 栃木県日光市**藤原19** → `36.840755 / 139.721939`, which is **1,308 m north** of the
superseded 鬼怒川観光ホテル (`36.829525 / 139.717556`). Our hotel's station is
**鬼怒川公園駅** (122 m away), not 鬼怒川温泉駅 — and that one-stop difference is what breaks two of
their three claims.

| Candidate | Their claim | Straight line from **NEW** hotel | From the OLD hotel | Verdict |
|---|---|---|---|---|
| 八海山 | "ramen-izakaya by the station" | **1,976 m SSW** | 669 m SSW | see below |
| さっちゃん | "25 min south" | **3,305 m SSW** (≈41 min walk) | 2,002 m (≈25 min) | **CORRECTED** — their figure is the old hotel's |
| ローソン 鬼怒川滝 | "330 m north" | **1,235 m WSW** | 871 m NW | **CORRECTED** — wrong from *either* hotel |

#### Hakkaisan / 八海山 — **VERIFIED with a caveat, and NEW (id `tmisc-hakkaisan`)**
- **"Ramen-izakaya by the station" is correct** — and it is the *wrong station for us*.
  栃木県日光市鬼怒川温泉大原1403-11, GSI → `36.823879 / 139.714966`. Reviewers put it
  「鬼怒川[温泉]駅から徒歩２、３分ほどの至近距離」 (two other reviews say 3 and 5 minutes). gnavi's
  own listing name is literally 「ラーメン居酒屋 八海山」, so their genre label is right too.
- **Not closed.** Nothing on any listing marks it 閉店.
- **THEIR UNVERIFIED HOURS ARE NOW PARTLY RESOLVED — and there is a Monday closure they never had.**
  One aggregator publishes 「11:00～15:00　18:00～翌2:00」, **定休日 月曜日**, tel 0288-76-8500.
  **Fri 11 Sep is a Friday, so it is open**, and the 18:00–02:00 block is the one that covers
  after-kaiseki.
- **Kept at `medium`, deliberately.** This shop has no website. Hot Pepper, 4travel, Yahoo Loco,
  gnavi, ramendb and cookdoor were all tried and **publish no hours whatsoever** (gnavi and Yahoo
  Loco 302-redirect away; ramendb 403s; cookdoor and gooグルメ are robots-blocked). The hours rest on
  a **single uncorroborated aggregator**. Their handoff was right to flag it; this is an improvement,
  not a resolution. **Ring 0288-76-8500 before sending anyone to the train.**
- Reaching it: walk 4 to Kinugawa-Koen, Tobu Kinugawa line **one stop** (~4 min), walk 4. A 25-minute
  walk was avoided deliberately — 2.0 km straight-line over gorge roads is not a 30-minute walk you
  want to promise in the dark.
- Sources: <https://iko-yo.net/facilities/76758> · <https://www.hotpepper.jp/strJ001098151/> ·
  <https://4travel.jp/dm_shisetsu/11201521>

#### Izakaya Sacchan — **CORRECTED, and NEW (id `tmisc-sacchan`)**
- 栃木県日光市鬼怒川温泉大原731-25, tel 0288-77-1783, GSI → `36.813065 / 139.708435`.
- **Hours and closing day, which they did not have: Mon–Sat 17:30–23:00, CLOSED SUNDAYS.**
  Fri 11 Sep is open. Budget **¥3,000–3,999** a head — a night out, not a nightcap.
- **"25 min south" is the old hotel's number.** From ours it is **3,305 m** ≈ 41 minutes on foot,
  which is over the 30-minute walk cap and correctly filed as walk 4 + train 4 + walk 10. Tabelog
  independently puts it **808 m from Kinugawa-Onsen station**, which matches.
- Honest caveat in the record: check the last northbound Tobu local back to Kinugawa-Koen before
  ordering a second round. Fallback is the taxi figure the hotel itself quotes, ~¥1,010.
- Source: <https://tabelog.com/en/tochigi/A0903/A090303/9005418/>

#### Lawson Kinugawa-Taki — **CORRECTED, and NEW (id `tmisc-lawson-taki`)**
- **"24 hours (ASSUMED)" is now CONFIRMED, from a municipal register.** Nikko City's own AED
  station list files this store with 「24時間」「全日」. That is a public body, so the record goes to
  `confidence: high`.
- 日光市鬼怒川温泉滝590番地1, tel 0288-76-3847, GSI → `36.834751 / 139.710266`.
- **"330 m north" is wrong from either hotel** — 871 m NW of the old one, **1,235 m WSW of ours**
  (≈1.5 km / 20 min on the road). Recorded plainly: **there is no konbini within 500 m of
  Hana no Yado Matsuya.**
- Source: <https://www.city.nikko.lg.jp/bosai_anzen/kyubyo/aed/5521.html>

### International Resort Hotel Yurakujo — Mon 14 Sep (arrive 17:30, dinner 18:00)

Hotel confirmed at 〒286-0221 千葉県富里市七栄650-35, tel 0476-93-1234.

#### Tomisatoya food hall — **ALREADY HAVE IT (`d7w30yj01`), claim VERIFIED, nothing to correct**
Their claim: *"in the complex — last order 21:00."* Correct, and already recorded. Re-confirmed on
the operator's own 湯楽城 food page: 富里屋, 「そば、うどん、海鮮丼、天麩羅などの本格的な和食」,
「月曜日17:00~21:30、火~日曜日13:00~21:30」, **L.O. 21:00**.

**The half of it their claim omits is the half that is date-tied:** on a **Monday** it does not open
until **17:00**, four hours later than Tue–Sun. 14 Sep 2026 is a plain Monday, so the group's 17:30
check-in lands 30 minutes after it opens. Also re-confirmed: the same Monday clock applies to
七栄屋, トミサト酒場 (**団体様専用**, groups only) and 甘味処, and the Bar is 「休業しております」.
No new record — `expand-d78.json` already carries all of this correctly.
Source: <https://chi-hotelsresorts.com/yurakujo/food/>

#### Sukiya — **CORRECTED, and NEW (id `tmisc-sukiya-tomisato`)**
Their claim: *"1.9 km west, runs almost all night."*

- **Distance: near enough.** すき家 富里店 is at 千葉県富里市七栄439-1, GSI → `35.738029 / 140.326645`
  — **1,753 m WSW** of the hotel. "1.9 km west" is a fair reading.
- **"Runs almost all night" is right, and "24 hours" would have been wrong.** The operator's own
  store page: 「4:00～翌3:00」 with 「AM3:00～AM4:00の間、休業いたします」. It shuts for exactly one
  hour a night. Free parking.
- The walk leg (26 min) is arithmetic, not advice: rural unlit road, no continuous footpath. Taxi
  after dark, and the lobby 7-Eleven covers most of what anyone actually wants.
- Source: <https://maps.sukiya.jp/jp/detail/335.html>

#### 7-Eleven on the grounds — **ALREADY HAVE IT, corrected (id `1c6a9c9d2a24`); their distance is WRONG**
Their claim: *"~80 m from the door."*

- **It is not 80 m from the door. It is inside the door.** The hotel's own facility page:
  「ロビー階には、食料品や日用雑貨などを取り揃えているコンビニエンスストア「セブンイレブン」や、
  リラクゼーションサロン「魔法の森」がございます」 — main building, **lobby floor**. An indoor walk,
  not 80 m across the grounds.
- This also **upgrades our own record**, which said "the hotel's own site does not list it, so
  neither its hours nor its exact position inside the building is confirmed". The position is now
  confirmed at source. **Hours are still published nowhere** — confirm at check-in; the record keeps
  that warning and stays `medium` for it.
- Worth flagging for whoever maintains this: the hotel's **access** page omits the store entirely.
  Only the **facility** page carries it, which is presumably why an earlier pass could not find it.
- Not to be confused with `5c207a0bfbd9` セブン-イレブン富里七栄中央店, a genuinely separate store
  **1,348 m SW** off the property. Both records are correct and both are kept.
- Source: <https://chi-hotelsresorts.com/facility/>

### Ishii Sports — **VERIFIED (upgraded from their UNVERIFIED), and NEW (id `tmisc-ishii-jimbocho`)**

Filed as an ordinary shop record, `category: "shopping"`, per the instruction — no climbing content.

Their record was right on every particular, and **their own handoff was wrong to leave the hours
unverified: the operator publishes them.**

| Their claim | Verdict |
|---|---|
| 石井スポーツ 登山本店 | **correct**, and the shop still exists |
| 2F Takii Tokyo Bldg, 1-6-1 Kanda-Jimbocho | **correct verbatim** — 「東京都千代田区神田神保町1-6-1 タキイ東京ビル2F」 |
| "100 m from Jimbocho Stn A5" | **correct** — the operator says from exit A5, left about 100 m; 2F of the building on the corner of the third alley, Saizeriya at street level |
| "10:00–20:30 (some listings say 20:00)" — **UNVERIFIED** | **RESOLVED: 10:00–20:30.** The operator's own shop page and **Chiyoda City's official tourism site** both print 「10:00～20:30」. The 20:00 variant is wrong. |
| closing days | **NOT in their record at all. It is 「無休」** — never closed — per Chiyoda City. So a Monday is fine. |
| tel | 03-3295-0622 (both sources) |

Coordinate: GSI resolves 東京都千代田区神田神保町1-6-1 to 神田神保町一丁目６番 →
`35.696281 / 139.759399`. That is the exact chōme-ban of the published address, so it is filed
`verified`; the shop is on 2F of that block.

**The transit leg they never worked out.** Their record had 3.6 km with a bare `ride: true`, which
our 30-minute walk cap forbids. The real journey, from 駅探's route engine:

- **Tsukiji → Jimbocho: 15 minutes, ¥290, ONE change.** Tokyo Metro **Hibiya line** from 築地 (H11)
  → 東銀座 → 銀座 → **日比谷**, change to **Toei Mita line** → 大手町 → **神保町**.
- Cheaper all-Metro alternative: **19 min, ¥180, two changes** — 築地 → 日比谷 (Hibiya) → 大手町
  (Chiyoda) → 神保町 (Hanzomon).
- Door to door: **walk 4** (market → Tsukiji Stn) + **train 15** + **walk 3** (A5 + 100 m) = **22 min
  each way**. That is what is in `legs[]`.

**Is it reachable inside the itinerary? No — and the record says so in plain words.**

- The Tsukiji slot is **10:50–11:50, 60 minutes**. The shop opens at 10:00, so it is trading.
- But **44 minutes of the 60 are transit**, leaving ~15 minutes in a two-floor shop, with zero
  margin and a coach that leaves without you.
- **Day 7 has no other gap**: Tokyo Tower 09:00–10:30 → Tsukiji 10:50–11:50 → Shisui 14:30–17:00 →
  hotel 17:30. Nothing free.
- **The window that does work is the free evening of Sun 13 Sep**, from Shinjuku Granbell. 駅探:
  **Toei Shinjuku line, Shinjuku ⇄ Jimbocho, direct, no change, 10 minutes, ¥220** (via 新宿三丁目,
  曙橋, 市ヶ谷, 九段下). The shop is open to 20:30 and never closes. That is the honest answer and it
  is in the `note`.
- Sources: <https://www.ishii-sports.com/shop/honten/> · <https://visit-chiyoda.tokyo/app/spot/detail/1005>
  · <https://ekitan.com/transit/route/sf-2554/st-2382> · <https://ekitan.com/transit/route/sf-2382/st-2334>

---

## 2. THE SHISUI COORDINATE — working and verdict

### The question
`notes.md` §5 warns that "Shisui resolves to a block centroid **1.8 km** off" and that a later
session must not "fix" it. `notes-expand-d78.md` §1a came to the opposite conclusion — that the
**seed pin** is ~2.3 km out — and left the two clusters unreconciled, with seven of its own records
on the new value and ten existing records on the old one. The source map supplies a third
independent number. This section settles it.

### The values, all of them

| # | Source | Coordinate | What it actually is |
|---|---|---|---|
| **A** | **The seed** — stop `21c5d54201ee`, read from `trip12_app_seed.json` | `35.7222 / 140.2696` | the pin under test |
| A′ | `day7-tokyo.json`, ten place/shopping/mustSee records | `35.722829 / 140.2696` | 70 m from A — same pin |
| **B** | **GSI, POI name** 「酒々井プレミアム・アウトレット」 | `35.724865 / 140.269562` | **returns the 酒々井町 town polygon, not the mall** — titled 「千葉県印旛郡酒々井町」 |
| **C** | **GSI, the published 住所** 「千葉県印旛郡酒々井町飯積2-4-1」 | `35.714443 / 140.290268` | resolves to 「千葉県酒々井町飯積２番地」 — block level |
| D | Mapion, 飯積2-4-1 | `35.71381181 / 140.29402333` | (carried by `expand-d78.json`) |
| E | MapFan, 飯積2-4-1 | `35.7129156 / 140.2938173` | |
| **F** | **The source map (Trip 1)** | `35.7139 / 140.2961` | the third independent value |
| **G** | **Chiba Prefecture's official tourism site**, ちば観光ナビ | `35.715061 / 140.296353` | a public body's published position — **a fourth independent value, new this session** |
| H | 酒々井温泉 湯楽の里 (Chiba Pref.) | `35.719689 / 140.293259` | the independent cross-check |

**The operator's address is confirmed at source**, twice: its own site prints
「〒285-0912 千葉県印旛郡酒々井町飯積2-4-1」, and Chiba Prefecture's page prints the identical string
with tel 050-1722-1639. So C, D, E are all geocoding the *right* address.

### Distance matrix (metres, haversine)

|  | A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|---|
| **A** seed | — | 296 | 2056 | **2394** | 2418 | **2564** | **2542** | 2154 |
| **B** GSI town | 296 | — | 2199 | 2527 | 2561 | 2688 | 2653 | 2215 |
| **C** GSI addr | 2056 | 2199 | — | 346 | 363 | 530 | 554 | 643 |
| **D** Mapion | 2394 | 2527 | 346 | — | **101** | **188** | 252 | 657 |
| **E** MapFan | 2418 | 2561 | 363 | 101 | — | 233 | 331 | 755 |
| **F** source map | 2564 | 2688 | 530 | 188 | 233 | — | **131** | 693 |
| **G** Chiba Pref | 2542 | 2653 | 554 | 252 | 331 | 131 | — | 586 |
| **H** Yura-no-Sato | 2154 | 2215 | 643 | 657 | 755 | 693 | 586 | — |

### The working

1. **Five independent sources agree.** C, D, E, F and G all fall inside a **554 m** circle. Their
   centroid is **`35.714026 / 140.294112`**, and each sits **25 m (D), 126 m (E), 180 m (F), 233 m
   (G), 350 m (C)** from it. Four of the five are within 250 m — smaller than the mall itself, which
   the operator's facility sheet gives as **~421,000 m²** of single-level open-air strip.
2. **The seed pin is 2,392 m WNW of that centroid** and shares the cluster with nothing.
3. **Here is what the seed pin actually is.** Ask GSI for the mall *by name* and it returns
   `35.724865 / 140.269562`, titled **「千葉県印旛郡酒々井町」** — the town. That is **296 m from the
   seed pin** and 2,199 m from the mall. **The seed geocoded the town, not the venue.** That is the
   whole error, and it explains why the number looked authoritative.
4. **Ask GSI for the address instead and it lands in the cluster** — `35.714443 / 140.290268`
   (「飯積２番地」), 350 m from the consensus. So GSI was never 1.8 km wrong about Shisui. The
   handover note in `notes.md` §5 mistook the *town-name* answer for the *address* answer and then
   generalised the wrong one into a warning.
5. **The independent physical cross-check settles it.** 酒々井温泉 湯楽の里 publishes
   「酒々井IC及び酒々井アウトレット駅より徒歩約700m」, and Chiba Prefecture puts it at
   `35.719689 / 140.293259`. Distance to the consensus centroid: **634 m** — matches "about 700 m".
   Distance to the seed pin: **2,154 m** — does not. Only one cluster reconciles with a distance the
   neighbouring operator published about itself.

### VERDICT

> **The seed pin is wrong. The mall is at ≈ `35.714 / 140.294`.**
>
> | Value | Error |
> |---|---|
> | **Seed `35.7222 / 140.2696`** (and the 10 `day7-tokyo.json` records at `35.722829 / 140.2696`) | **wrong by ~2.4 km WNW** — it is the 酒々井町 town centroid |
> | GSI on the POI *name* | wrong by ~2.5 km — returns the town polygon; **do not use it for this venue** |
> | GSI on the *address* | right to **~350 m** (block-level, as designed) |
> | Mapion `35.713812 / 140.294023` | **the best single value — 25 m from the five-source consensus** |
> | MapFan | right to ~126 m |
> | **The source map's `35.7139 / 140.2961`** | **right to ~180 m** — their value is *good*, and materially better than ours |
> | Chiba Prefecture official `35.715061 / 140.296353` | right to ~233 m; corroborates the source map to **131 m** |
>
> `notes-expand-d78.md` §1a was correct and `notes.md` §5's Shisui warning is **withdrawn**.

**Value emitted: `35.713812 / 140.294023`.** Chosen over Chiba Prefecture's slightly more
authoritative G for two reasons: it is the closest of all candidates to the five-source consensus
(25 m), and **seven records in `expand-d78.json` already carry it**, so one value makes the entire
Shisui cluster internally consistent instead of leaving a 250 m seam. G is recorded here as the
official corroboration, 252 m ENE — the same site, nearer the middle of the strip. Kept
`coordPrecision: "approximate"` because the mall is 421,000 m² and no operator page publishes a
point; `confidence: "high"` because the 2.4 km correction itself is beyond doubt.

### Corrections emitted, and the rest for the importer
Four records carry the fix — the three that actually function as map pins plus the photo spot:

| id | Collection | Record | Why this one |
|---|---|---|---|
| `d7ss08` | places | Car and coach park | **the pin the coach driver navigates to** |
| `fa666ecac0f8` | places | Information Center | the group's single hard regroup point |
| `d7ss01` | places | Food court | the most-used in-mall record |
| `d7ms03` | mustSee | Shisui central plaza | the photo position |

**The remaining 11 records in `day7-tokyo.json` carry the same wrong pin and need the same value
applied mechanically** — they were not re-emitted because their prose needs no change and eleven
near-identical records would be noise:

- `places`: `d7ss02` (ATM 1140), `d7ss03` (7-Eleven 1845), `d7ss04` (coin lockers),
  `d7ss05` (United Arrows), `d7ss06` (Calvin Klein), `d7ss07` (Ecco) — all at
  `35.722829 / 140.2696`; and `bc5a016012e6` (boiled Chiba peanuts) at `35.720661 / 140.269265`.
- `shopping`: `5d01ea5b3bc6`, `79f0ed3f2ac1`, `7ccc08bd6ba7` at `35.722829 / 140.2696`;
  `d7sh04` at `35.720661 / 140.269265`.

**Set all 11 to `latitude 35.713812`, `longitude 140.294023`, `coordPrecision "approximate"`.**

**Still outside this schema, and it is the one that matters most:** the **stop** record
`21c5d54201ee` in `days[].items[]` holds `35.7222 / 140.2696`. The deploy session must fix it there
— exactly like the Narita stop record `184f9cf0f25a` already flagged in `notes.md` §2e. Left
unfixed, the app drops the Day 7 afternoon pin in the middle of 酒々井 town, 2.4 km from the mall.

Sources: <https://www.premiumoutlets.co.jp/shisui/> · <https://maruchiba.jp/spot/detail_12507.html> ·
GSI on 「酒々井プレミアム・アウトレット」 and on 「千葉県印旛郡酒々井町飯積2-4-1」 ·
<https://www.mapion.co.jp/phonebook/M02004/12322/ILSP0055679051_ipclm/> ·
<https://mapfan.com/spots/SCYHC,J,JQ0>

---

## 3. THE FOOTBATH NAME — Waraku Ashiyu vs Warashiyu

**Neither of us has the place wrong. We have half the name each, and there is a documented answer.**

**Obanazawa City's own tourism page prints the name with its furigana:**

> **「和楽足湯(わらしゆ)」**, 6:00～22:00, 無料, 源泉をそのまま使用した, 温泉街の中心にあります

- **The kanji we hold — 和楽足湯 — is correct.** No change.
- **The reading we hold is not.** "Waraku Ashiyu" is the naive character-by-character reading
  (和楽 = waraku, 足湯 = ashiyu). The city's own furigana is **わらしゆ**.
- **The source map's "Warashiyu" is the correct romanisation** of that reading. They were right, and
  we were wrong — about the reading only.
- It is a compression pun: 和楽足湯 → **わ‑ら‑し‑ゆ**, with 足湯 folded into the name rather than read
  as a separate word. That is why the two romanisations look like two different places, and why an
  independent corroborating page is filed under the slug `ginzan-warasinoyu`.

**Answer: the correct full form is 和楽足湯, read and romanised WARASHIYU.** Record `70e89c03f9e4` is
corrected to `和楽足湯（わらしゆ）` / "Warashiyu footbath (和楽足湯)". Everything else in it stands:
06:00–22:00, free, source-fed, at the street entrance by Shirogane Bridge.

**One loose end for the importer:** `d3mustsee01` in `day3-ginzan.json` is titled "Street-entrance
apron by **Waraku Ashiyu** — banner fallback" and its `nameJp` is 銀山温泉入口 **和楽足湯**前. The
kanji is fine; the romanisation in the title should read **Warashiyu**. Not re-emitted — it is a
one-word title edit in a record whose content is otherwise unaffected.

Sources: <https://www.city.obanazawa.yamagata.jp/kanko/kankochi/1346> ·
<https://onsensoba.sakura.ne.jp/ginzan-warasinoyu.html>

---

## 4. What could not be verified, and what was blocked

**Genuinely unverifiable after retries:**

1. **Hakkaisan's hours remain single-sourced.** 「11:00～15:00 / 18:00～翌2:00」, 定休日 月曜日 comes
   from one aggregator and one only. Six other listings publish no hours at all; the shop has no
   site. Filed `medium` with the reason named. **Phone 0288-76-8500.**
2. **Abe Kamaboko Matsushima's hours (9:00–18:00) are Miyagi Navi's, not the operator's**, and
   **no closing day is published anywhere** for it. Filed `medium`.
3. **The lobby 7-Eleven's hours at Yurakujo.** Position now confirmed by the operator; hours are
   published nowhere. The record keeps "do NOT assume 24 hours — confirm at check-in".
4. **Knife-engraving turnaround.** No shop publishes one. See §1.
5. **The Ginzan curry-pan relocation may have completed** — Roman-kan's post is dated 8 July 2022 and
   says 「現在移転準備中」. Whether はいからさん通り has since reopened at its own address is unknown.
   Both current outlets are confirmed either way.

**Blocked hosts (each tried once, retried once where the brief allows):**
`matsushima-kanko.com` (robots.txt timeout — both the shop and the 体験 pages), `tojiro.net`
(robots.txt timeout, twice, including the 名入れ page), `aritsugu.jp` (robots.txt timeout, twice),
`ramendb.supleks.jp` (403), `cookdoor.jp` (robots 429), `gourmet.goo.ne.jp` (robots DNS failure),
`map.yahoo.co.jp` (robots disallow), `www.tobu.co.jp` station pages (redirect loop),
`shoppingcenter.geomedian.com` (403), `ja.wikipedia.org` raw wikitext (cache-only, as documented),
`premiumoutlets.co.jp/shisui/access/` (redirect loop — the top-level page and the English access
page both worked). `r.gnavi.co.jp` and `loco.yahoo.co.jp` 302 to their own home pages.

**Per the standing brief:** no `images` key anywhere in this batch, and no `essentials` block.

---

## 5. Summary of what was emitted

**7 new records** — `tmisc-abe-matsu`, `tmisc-hakkaisan`, `tmisc-sacchan`, `tmisc-lawson-taki`,
`tmisc-sukiya-tomisato`, `tmisc-ishii-jimbocho`, `tmisc-abe-teyaki`. None of these ids or names
collides with anything in the sixteen existing batch files.

**9 corrections reusing existing ids** — `70e89c03f9e4` (footbath name), `e5bb2ba00c92` (no
bookings, oyster season), `1c6a9c9d2a24` (7-Eleven position), `fa666ecac0f8` · `d7ss08` · `d7ss01` ·
`d7ms03` (Shisui coordinate), `d3shopcurry1` (curry-pan shop name and the Roman-kan outlet),
`1c0aa6c25b8c` (engraving confirmed, "several shops" rejected).

**3 candidates verified with nothing to change** — 築地山長, 丸武, 富里屋. All three already held
correctly, at the right coordinates, with the operator's or the market association's own hours.

**Nothing carries `confidence: "high"` on the source map's say-so.** Every `high` in this batch rests
on an operator page (Sukiya, Ishii Sports, Abe's ¥300/no-booking rule, Yakigaki House, the Yurakujo
food page, the Tsukiji market directory) or on a public body (Nikko City's AED register, Obanazawa
City, Chiyoda City, Chiba Prefecture, GSI).
