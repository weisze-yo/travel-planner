# notes6.md — Day 6, Sun 13 Sep 2026 · Hotel Nikko Tsukuba → Hitachi Seaside Park → Kawagoe Old Town → Shibuya Crossing → Shinjuku Granbell Hotel (Kabukicho)

Batch: `day6-hitachi.json` — 34 places, 8 must-see, 8 shopping, 2 sub-routes,
4 essentials blocks, 4 per-stop outfit blocks. Validator: 0 errors, 0 warnings.

Sun for the day (from the validated day record): sunrise 05:18, sunset 17:48.
Hitachi 09:40 sun SE az 135° alt 48°; Kawagoe 13:45 SW az 231° alt 46°;
Shibuya 15:45 WSW az 256° alt 24°. App day temperature 29° / 22°.

---

## 1. THE APP IS WRONG ABOUT THE FLOWERS. Say it before the coach leaves.

The app's own Day 6 summary line reads:

> *"Seaside nemophila fields, historic Kawagoe, and the iconic Shibuya Crossing,
> ending overnight in Shinjuku."*

**There will be no nemophila.** Not a few, not past their best — none. Nemophila at
Hitachi Seaside Park is a mid-April to early-May flower and the hill is replanted
afterwards. The park's own Miharashi Hill page describes the slope as covered in
nemophila from mid-April to early May; by mid-September the same slope has been under kochia for two
months. Anyone shown the app line and then taken up that hill in September has been
promised the single most famous flower picture in Japan and given a different one.

### What IS actually there on 13 September, from the park's own flower calendar

| Plant | Official 見頃 | Where | State on 13 Sep |
|---|---|---|---|
| **緑コキア — GREEN kochia** | **緑葉：8月中旬から9月下旬** | みはらしの丘 | **Peak. This is the day's picture.** |
| パンパスグラス — pampas grass | 8月下旬から9月上旬 | ぴょんぴょんサークル 他 | Just past peak, plumes still standing |
| ジニア — zinnia | 7月下旬から8月下旬 | みはらしの里 | Over |
| コスモス — cosmos | 10月上旬から10月下旬 | みはらしの丘 base, grassland | Not yet — three weeks early |
| コキア red 紅葉 | 10月中旬 | みはらしの丘 | Not yet. Gradient green→red only from 10月上旬 |
| バラ — roses | 10月下旬から11月上旬 | 常陸ローズガーデン | Not yet |
| ハマギク・リュウキュウハギ・イソギク | 10月上旬 onwards | dune area | Not yet |

Sources: the park's own kochia page (https://www.hitachikaihin.jp/flower-plant/flower/kochia.html),
summer calendar (https://www.hitachikaihin.jp/flower-plant/summer.html) and autumn calendar
(https://www.hitachikaihin.jp/flower-plant/autumn.html).

**The scale, from the park operator's own press release** (公園財団, PR Times
000000222.000032901): about **40,000 kochia** over about **2.3 ha** on Miharashi Hill
(up from 33,000 over 1.9 ha), 50–60 cm in mid-August and about 70 cm by the end of the
month. So on 13 September: forty thousand lime-green domes at knee-to-thigh height,
full size, with the Pacific behind them. That is a genuinely excellent photograph — it
is simply not the photograph the app promised.

**§2 CONFIRMED, not contradicted:** "Kochia at Hitachi — green until mid-October".
The official window closes a little earlier than "mid-October" for the pure green
(緑葉 to 9月下旬, then a green-red gradient in early October), but on 13 September the
finding is exactly right.

**Practical consequence for the group:** the merchandise is nemophila-branded too. The
West Gate retail counter's listed stock includes ネモフィラブルーティー (Nemophila Blue
Tea). Buying "the nemophila souvenir" in September is possible; seeing the flower is not.

---

## 2. §2 CONFIRMED: Hitachi Seaside Park closes TUESDAYS, and 13 Sep is open

Straight from the park's own 開園日・時間 page
(https://www.hitachikaihin.jp/guide/schedule.html):

- 休園日: **毎週火曜日（火曜日が祝日にあたる場合は直後の平日）**, plus 12月31日・1月1日
  and 2月の第一火曜日の前日から直後の金曜日まで.
- Hours: **9月1日から10月31日まで 9時30分から17時00分まで**.

Sunday 13 September 2026 is a normal open day, and the itinerary's 09:30 arrival is the
opening bell exactly. No Monday closure anywhere in the park's calendar. Written into
`essentials["Hitachi Seaside Park"].hours` as `tue: null` with the rest 09:30–17:00.

Also confirmed from the official ticket page (https://www.hitachikaihin.jp/guide/ticket.html):

- Adult ¥450, **group ¥290 for 団体 20名以上**, silver 65+ ¥210, middle school and under free.
- The **+¥350 seasonal surcharge does not apply**: spring is 2026年4月3日から5月6日 and
  autumn is 例年、10月のうち20日間程度. Mid-September falls in neither.
- Large-bus parking ¥1,800. Seaside Train 1日周遊券 ¥600. Rental cycles ¥600 for three
  hours or ¥800 all day (the seed said "¥600 adult" — that is the 3-hour rate).

---

## 3. Itinerary-versus-hours conflicts found this session

**a) Kinen no Mori Rest House does not open until 10:00.** The group is in the park
09:30–10:30. The rest house — which is where the Hitachinaka 干し芋タルト, the melon
baum and the melon and sweet-potato soft-serve actually are, plus toilets and free
Wi-Fi — opens at 10:00 and closes an hour before the park. So two thirds of the stop it
is shut. The outlet that *is* open at 09:30 is **Lakeside Cafe** (レイクサイドカフェ,
9時30分から閉園時間まで, West Gate area, takeout only).

**b) The West Gate shop trades weekends only — and this is a weekend.** Lakeside Cafe's
retail counter is 物販：平日休業（土日祝日のみ営業）. Sunday 13 September qualifies, so the
souvenir shelf is open. A weekday version of this stop would find it closed. Lucky, not
planned.

**c) The Glass House is on the wrong side of the park.** Official page: it is in the
砂丘エリア, nearest gate **海浜口・風のゲート**, Seaside Train stop 海浜テラス, parking P16.
It is not reachable and back from the West Gate inside 60 minutes. The seed's mustEat
line offers it as "the one place to sit with a full Pacific horizon" — true, and not
available on this stop. Its hours are 9時30分から閉園1時間前まで, i.e. 09:30–16:00 today.

**d) One hour at Hitachi, honestly.** The park is **350 ha planned with 215.2 ha open**.
The Seaside Train's **full loop is about 40 minutes** across 9 stops — two thirds of the
stop for one lap — and the direct runs to Miharashi Hill are explicitly 春や秋の行楽
シーズン extras, which mid-September is not. So the realistic 60 minutes from the West
Gate is: gate → Miharashi Hill on foot (about 17 minutes, see §7 for why that figure is
an estimate) → the summit and the low-angle frame → back. That is it. The Ferris wheel,
the dune area, the rose garden and the Glass House are all out, and the Ferris wheel is
a **separate Pleasure Garden payment** on top of admission (ride tickets in ¥100 units,
or a ¥3,600 one-day free pass).

**e) The Toki no Kane chime is missed by 30 minutes.** The city's official page confirms
the automatic striker at **午前6時・正午・午後3時・午後6時**. The coach leaves Kawagoe at
14:30. This is a photograph, not a sound — as the seed already said.

**f) Kawagoe's arithmetic does not close.** The app prints Hitachi 09:30 (1 hr) →
**11:30 lunch** → transfer **~2 h / ~150 km** → **13:30 Kawagoe**. 11:30 + 2 h = 13:30,
which leaves **zero minutes for the meal**. Either the lunch stop is much shorter than
an hour or the 2 h leg is optimistic; Hitachinaka to Kawagoe is nearer 180 km via the
Ken-Ō Expressway. Same shape on the first leg: 08:30 out of Tsukuba, "~1 h / ~74 km",
09:30 at the park — Tsukuba to Hitachinaka is nearer 90 km. **And the park opens at
09:30 exactly, so there is no early-arrival buffer to absorb a late run** — any delay is
taken straight out of the 60 minutes on the hill. Flagging, not fixing; the itinerary is
fixed.

**g) Nothing in Shibuya has a group rate, and the coach cannot wait.** There is no coach
bay at the crossing and Shibuya has almost no tour-coach parking. The nearest documented
option is Ebisu Garden Place — 3 buses, ¥5,000 for the first three hours, reservation
required — one station away. Plan a drop and a timed pick-up with the driver, and give
35 people a hard muster time before anyone crosses.

**h) Tomorrow morning, again: Shinjuku Gyoen does not work.** Opens 09:00, half an hour
after the coach leaves on the 14th, and Monday is its closing day. Use Hanazono Shrine
(ungated, any hour, 6 minutes) for the dawn walk. Sunrise on the 14th is 05:23.

---

## 4. THE BIG CORRECTION: every Kawagoe coordinate in the seed is about 250–350 m out

This is the most consequential thing I found. The seed's Kawagoe cluster sits at roughly
lat 35.9247–35.9261, lon 139.4838–139.4850. The true positions are roughly lat
35.9219–35.9246, lon 139.4810–139.4838 — a systematic shift of about **250–350 m to the
north-east**. Records marked `verified` in the inventory were among the wrong ones.

Three independent lines of evidence, agreeing:

1. **Kawagoe Matsuri Kaikan**, address 元町2丁目1番地10. Japanese Wikipedia gives
   `北緯35.924306度 東経139.482361度`. Japan's official GSI geocoder gives 元町二丁目1番 →
   `[139.48262, 35.924232]`. **They agree within about 30 m.** The seed had
   `35.926111, 139.485`.
2. **Toki no Kane**, address 幸町15-7. The Saitama prefectural tourism site's own map
   embed gives `35.923476, 139.483335`; GSI gives 幸町15番地 → `[139.483627, 35.923595]`.
   **Agree within about 30 m.** The seed had `35.925603, 139.484444` — about 250 m NE.
3. **Kashiya Yokocho**. Japanese Wikipedia gives `北緯35.924611度 東経139.481056度`;
   GSI gives 元町二丁目11番地 → `[139.480865, 35.92411]`. Consistent.

Cross-check that the corrected set is internally coherent: south to north along the
street, GSI returns 幸町2番 35.9219 → 幸町4番 35.9227 → 幸町7番/15番 35.9236 →
元町1丁目15番 35.9246, with 元町1丁目3番 (City Hall, the coach drop-off) off to the
north-east at 35.9250, 139.4857 — which is exactly where City Hall should be relative to
the bell tower, about 290 m away. The seed's cluster, by contrast, put shops that are
1.1 km apart on top of each other.

### What I changed, and to what

| id | Record | Seed value | New value | Precision |
|---|---|---|---|---|
| `21181d81b459` | Toki no Kane | 35.925603, 139.484444 | **35.923476, 139.483335** | verified |
| `832c1aaef868` | Kawagoe Matsuri Kaikan | 35.926111, 139.485 | **35.924306, 139.482361** | verified |
| `aae9625a5c19` / `d6kawagoe04` | Kashiya Yokocho | no coordinate | **35.924611, 139.481056** | verified |
| `1e0a21362096` | Koedo Kurari | 35.926116, 139.483809 | **35.916283, 139.48378** | approximate |
| `ada0ef53b513` | Former Eighty-Fifth Bank | 35.924722, 139.484722 | **35.922665, 139.483154** | approximate |
| `8b6833c6d287` | Osawa House | 35.925278, 139.484167 | **35.924648, 139.483246** | approximate |
| `8572e0e989d2` | Kasho Umon | 35.925229, 139.485 | **35.923595, 139.483627** | approximate |
| `f565e4c5eef1` | Ogakiku | 35.923061, 139.484664 | **35.92075, 139.483032** | approximate |
| `6d40ab11c4ff` | must-see: Toki no Kane | 35.925603, 139.484444 | **35.923476, 139.483335** | verified |
| `6aeca8b336e1` | must-see: Kurazukuri St | 35.924959, 139.484917 | **35.922665, 139.483154** | approximate |

The `approximate` ones are GSI **街区 (block) representative points** for the exact
番地, not building footprints, so they are good to roughly ±50 m — honest, and far better
than being 300 m out. Only the two with two independent agreeing sources are `verified`.

**Koedo Kurari was the worst: 1.1 km out.** It is at 新富町1-10-1, on Crea Mall by
Hon-Kawagoe Station — *not* on the kurazukuri street. The seed's coordinate put it beside
the bell tower. From the coach drop-off it is a 15-minute walk each way, so in a 60-minute
stop it is out of reach, and the note now says so.

**Note for whoever does Day 7 or re-runs Day 2–5:** the GSI geocoder is excellent in
Tokyo (道玄坂2-29-1 → SHIBUYA109 to within 20 m; 渋谷2-24-12 → Scramble Square to within
20 m) but I had to prove it against Wikipedia and the prefectural tourism site before
trusting it in Kawagoe, because I initially assumed the *seed* was right. It was not.
Do not assume `coordPrecision: "verified"` in the seed means checked.

---

## 5. Other corrections to the inventory and the seed

**MAG'S PARK is now ¥1,800, not ¥300 or ¥600.** The paid rooftop over the crossing is
today sold as **CROSSING VIEW & ROOFTOP LOUNGE MAG8**, R floor of MAGNET by SHIBUYA109:
`入場料：1人1,800円(1DRINK付)`, `営業時間 10:00〜22:00 ※最終入場 21:30`, with a separate
Crossing Photo sky-camera at `撮影：1回 1,500円（150秒）`
(https://magnetbyshibuya109.jp/shop/shibuya-mag8/). Time Out Japan still prints ¥300 plus
¥1,000 for the photo and other guides print ¥600; both are stale. **For 35 people that is
¥63,000** — send two or three volunteers, not the group.

**Ogakiku closes THURSDAYS, not Mondays.** The seed says "Commonly closed Mondays — today
is Sunday, so it should be open". The restaurant's own Gnavi listing says
`木曜日※祝日は営業。不定休あり`, and Sunday/holiday service is continuous 10:40–18:00 last
order. So the conclusion (open on 13 Sep) survives, but for the wrong reason. Separately:
50 seats and about ¥4,000 a head means 35 people are not walking in during a one-hour stop.

**The fu-gashi is 95 cm, not a metre.** Matsuriku Seika's own listing:
`麩菓子も沖縄の黒糖を使用した味も長さ(95センチ)も日本一です`. The shop is 元町2-11-6,
10:00–17:00, **closed Mondays** (Sunday is fine), 049-222-1577, price band ¥500–2,000. The
only published price for the fu-gashi itself is ¥400 in a 2010 report, so the ¥500
estimate in the batch is an update, not a quote.

**"Tokyu Food Show" at Scramble Square B2 is Tokyu Food Show EDGE.** Different hall from
the original Tokyu Food Show on the station side. Renamed in the record.

**Kashiya Yokocho's shop count is contested.** The city's official page says `30数軒`;
Japanese Wikipedia says `20数件`, down from `70軒以上` in early Showa. I kept the city's
figure and flagged the other in the record.

**Kurazukuri Honpo's Fukugura has a 7-day shelf life, at room temperature.** Maker's own
page: ¥210 each, ¥1,100 for five, ¥1,460 for six, ¥2,090 for nine, ¥4,400 for twenty,
`賞味期限 ７日`, `常温で保存`. So it rides the coach and the flight fine, but bought on the
13th it expires on the 20th — a first-week-home gift, not a keeper. The Ichibangai branch
is 幸町2-16, 10:00–18:00, **closed Tuesdays**.

**Kasho Umon's imo-koi gift box is FROZEN.** `賞味期限 製造日より冷凍90日`. Same trap as
the Ginzan karinto-manju on Day 3: 90 days *frozen* is not 90 days in a suitcase. Eat it
hot at the counter (about ¥250; the 5-piece service box is ¥1,250). Shop: 幸町15-13,
10:00–18:00, closed only over New Year, 049-226-5663.

**There is no evidence the seed's "Scramble Square 2F walkway" overlooks the crossing.**
It is real, free and public, and it is a fine regroup point on the east side — but no
official source describes a crossing view from it, and I could not find one. The record is
now `confidence: medium` with that stated, and the must-see for the elevated view names
what I *could* verify instead: the **Shibuya Mark City 2F glass corridor** (free, station
hours, glass wall, `スクランブル交差点を斜め上の低い位置から見ることができます`, and
Okamoto's *Myth of Tomorrow* mural is on the same wall), **SHIBU NIWA** on Tokyu Plaza
Shibuya's 17F (free, `一般の方もご利用を頂けます`, closes in bad weather), and the
Starbucks SHIBUYA TSUTAYA 2F window counter for the price of a drink.

**Myth of Tomorrow's coordinate was north of the crossing.** The mural is in the 2F
concourse between the JR Tamagawa-guchi gates and the Keio Inokashira gates, inside Mark
City. Moved to the Mark City block point, marked approximate.

**The seed contradicts itself on sunset.** The day record says `sunset 17:48`; the Shibuya
stop summary says "well before the 17:54 sunset". Both cannot be right. I used 17:48 (the
validated solar record) and did not touch the stop summary. Worth someone reconciling.

**The app's own Day 6 header says "Tochigi → Ibaraki → Tokyo"** but the day begins at
Hotel Nikko Tsukuba, which is in **Ibaraki**. Minor, and transcribed as printed.

**Mission 4 does not apply to this group.** The app groups the Company Reel spots
`Trip 21–32 → DAY 6 HITACHI SEASIDE`, and Trip 12 falls in `Trip 11–20 → DAY3 WITH
YUKATA`. So the single most photogenic stop of Day 6 is *not* Trip 12's assigned reel
location — worth saying out loud so nobody stages the reel on the hill and loses the
sub-group frame they actually owe.

---

## 6. Coordinates promoted to `verified` this session

| Record | Coordinate | How |
|---|---|---|
| `832c1aaef868` Kawagoe Matsuri Kaikan | 35.924306, 139.482361 | ja.wikipedia infobox + GSI 元町二丁目1番, agreeing to ~30 m |
| `21181d81b459` / `6d40ab11c4ff` Toki no Kane | 35.923476, 139.483335 | Saitama prefectural tourism map embed + GSI 幸町15番地, agreeing to ~30 m |
| `aae9625a5c19` shopping + `d6kawagoe04` place, Kashiya Yokocho | 35.924611, 139.481056 | ja.wikipedia infobox + GSI 元町二丁目11番地 |
| `57bf0b2af0a7` SHIBUYA109 | 35.659466, 139.698898 | GSI 道玄坂二丁目29番1号 |
| `15437da8658b` Scramble Square 2F + `5ee260408c1b` Food Show EDGE | 35.657951, 139.702316 | GSI 渋谷二丁目24番12号 |
| `75abcc7637a9` Q FRONT / TSUTAYA + `d6shibuya04` Starbucks 2F | 35.659824, 139.700226 | GSI 宇田川町21番6号 |
| `9d55f55c86a4` MAG8 rooftop | 35.659771, 139.700775 | GSI 神南一丁目23番10号 |
| `d6shibuya01` Mark City 2F corridor | 35.658337, 139.698578 | GSI 道玄坂一丁目12番1号 |
| `d6shibuya02` SHIBU NIWA | 35.657677, 139.700531 | GSI 道玄坂一丁目2番3号 |

Downgraded or left approximate on purpose: `f0fd97e06271` Myth of Tomorrow (building
point, not the mural wall), `d6shibuya03` Hikarie 11F, `1b8165fc63eb` 13F rooftop bar and
`cf7c63b3e943` Don Quijote (GSI resolves **歌舞伎町 only to the district centroid**
`[139.701294, 35.695393]`, so nothing in Kabukicho could be promoted), and the six
Kawagoe block points listed in §4.

Two Hitachi records carry **no coordinate at all** — the West Gate ticket windows
(`d6hitachi01`) and Kinen no Mori Rest House (`d6hitachi02`). The park's postal address
(茨城県ひたちなか市馬渡字大沼605-4) geocodes only to the 馬渡 district centroid
`[140.572067, 36.398067]`, about 2 km west of the gate, and the park publishes no
coordinates for its own facilities. An absent coordinate beats a confident wrong one.

---

## 7. What I could not verify, and where the numbers are estimates

- **The West Gate → Miharashi Hill walking time.** The park publishes no figure and its
  digital map is JavaScript-driven. The 17 minutes in the record is scaled off the park
  map; the whole "one hour is very short" argument rests on it, so it is worth a phone
  call to 029-265-9001 or a question at the gate.
- **The Ferris wheel's single-ride fare.** `pleasure.hitachikaihin.jp` blocks automated
  fetching. What is confirmed: Pleasure Garden ride tickets are sold in ¥100 units and the
  1-day free pass is ¥3,600 (¥3,000 discounted, ¥12,800 for four together).
- **Seaside Train stop numbering.** Official pages give stop 8 for Kinen no Mori and
  stop 海浜テラス for the Glass House, but the West Gate appears as both "9番" and "10番"
  on different official pages. I asserted no West Gate stop number.
- **Everything about the hotel's own facilities.** `granbellhotel.jp` blocks automated
  fetching, and this session could not reach a single page on the hotel's own domain.
  Confirmed from directories instead: address 東京都新宿区歌舞伎町2-14-5 (matching the
  app's Google Maps link text — **this is the KABUKICHO Granbell, not the Shibuya one**),
  phone **03-5155-2666**, check-in 15:00, check-out 11:00, a 12F restaurant and a 13F
  rooftop bar. **Unverified and carried over from the seed:** the 13F bar's Sunday
  14:00–22:30 hours, its 62 seats, the ¥500 table charge being waived for guests, and the
  12F Restaurant G breakfast at 07:00–10:30. All four are marked `medium` with that said.
  One oddity: JTB and Jalan both list **487 rooms**, which does not match the small
  designer hotel the seed describes — I have not asserted a room count either way.
- **Kameya's imo-sen price.** The company publishes no online price; ¥600 is a budget
  figure. Addresses and hours are official (本店 仲町4-3, 09:00–18:00, 049-222-2052;
  時の鐘店 幸町7-7, 10:00–17:30, 049-225-7451).
- **Park merchandise prices.** The Lakeside Cafe stock list is official; no prices are
  published, so ¥1,000 is a budget figure for a plush keychain or tea tin.
- **Whether Koedo Kurari actually stocks COEDO Beniaka.** The city's official page lists
  `埼玉県内32蔵の日本酒` tasting and Koedo-Kawagoe brand goods, and does not mention COEDO
  beer. Marked `medium` and said so. (It is also 15 minutes' walk away, so moot.)
- **Godzilla Head, Kabuki Hall, Hanazono Shrine, Golden Gai** — all carried over from the
  seed's night list unchanged and marked `medium`; none has an operator page that this
  session reached. The one night item I *did* verify officially is the Metropolitan
  Government observatory, below.
- **Shibuya coach parking.** The Ebisu Garden Place figures are from a coach-industry
  magazine, not a Shibuya City page.
- Not re-checked at all, and left as the seed has them: the hoshi-imo production-share
  claim for Hitachinaka and Tokai, the Ibaraki Earl's melon season, Kawagoe Castle
  Honmaru Goten's Monday closure, and Shinjuku Gyoen's fees.

## 8. One thing verified better than the seed had it

The **Tokyo Metropolitan Government observatories**, from the Bureau of Finance's own page
(https://www.zaimu.metro.tokyo.lg.jp/tochousha/goannai/tenbou): `入室料金 無料`, South deck
`入室可能時間：9時30分〜21時30分` with last entry 30 minutes before closing, **South closed
1st and 3rd Tuesdays, North closed 2nd and 4th Mondays**. Sunday 13 September has both
decks open. The seed's "09:30–22:00, last entry 21:30, FREE" is right, and now sourced —
and the North deck's separate closing day is new. This remains the best free thing to do
with the trip's one genuinely open evening: two Oedo Line stops from Higashi-Shinjuku to
Tochomae, ¥180, 202 m up, no cover charge, and back by 22:15.
