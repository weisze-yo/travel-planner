# notes3.md — Day 3, Thu 10 Sep 2026 (Ginzan Onsen · Zao Fox Village · Yoshikawaya)

Research notes for `day3-ginzan.json`. Everything here either confirms a §2 correction,
contradicts one, or names something I could not verify. Nothing in this file was silently
written into the batch.

---

## 1. THE ZAO FOX VILLAGE CLOSING-TIME CONFLICT — verified against the operator

**Verified, from the operator's own site** (zao-fox-village.com):

> 「9:00~16:30(最終入場16:00) 夏季営業」
> 「9:00~16:00(最終入場15:30) 冬季営業」

So in the summer period the park **closes 16:30 with last admission 16:00**.

**The season boundary.** The operator publishes the two hour sets *without dates*. Miyagi
Prefecture's official tourism site (VISIT MIYAGI) dates them: **mid-March–November
09:00–16:30, December–early March 09:00–16:00, last admission 30 minutes before closing.**
Shiroishi City's tourism catalogue splits the year 3/16–11/30 · 12/1–1/31 · 2/1–3/20, and
Jalan gives 通常期 3/16～11/30. All four agree that **10 September falls in the summer
period**, so the operative closing time on the day is **16:30, last admission 16:00**.
I used `seasonFrom: "03-16"` / `seasonTo: "11-30"` and flagged the switch dates as the
medium-confidence part of that essentials block.

**Against the itinerary.** The app (trip12_app_extract.md §3, Day 3) prints:

| 3:10pm | Zao Fox Village | 1hr 30min Tour |
| 4:40pm | Depart to hotel |

- Arrival 15:10 is fine — 50 minutes inside the last-admission window.
- **Departure 16:40 is 10 minutes after the gate closes.** The real stop is **80 minutes,
  not 90**, and the last 10 minutes of the printed plan do not exist.
- Practical consequence for 35 people: the shop shuts with the park, so souvenir buying has
  to happen *before* the final circuit, not after it. The coach should be boarding at 16:30,
  which means the regroup call goes out at about 16:15.
- **Raise the 10-minute overrun with the agent.** It is in `closedNote` for the stop.

**Why the printed plan says 16:40 — the stale-hours trail.** Almost every secondary source
still prints the *old* 17:00 close, which is very likely where a 16:40 departure came from:

| Source | What it still says |
|---|---|
| Shiroishi City tourism (shiroishi-navi.jp, shiroishi.ne.jp) | `9:00~17:00(冬期は16:00まで)`, adult **¥1,000** |
| Miyagi DMO (miyagidmo.jp/en) | summer 9:00–17:00, last admission 16:30, **¥1,000** |
| Discover SENDAI | 9:00–17:00, **¥1,000**, "Closed days: None" |
| Tohoku Kanko (tohokukanko.jp) | no hours |
| Jalan | `通常期(3/16～11/30) 9時～17時`, **¥1,000**, and a garbled/wrong address |

The operator's own page and the Zao Town tourism association
(zao-machi.com: 「9:00～16:30 / 冬期16:00」`入園は閉園30分前まで`, `大人（中学生以上）1,500円`)
are the two that are current. **Per the §1 source hierarchy the operator wins.** Treat every
¥1,000-and-17:00 page as stale.

**Closed day — Thursday 10 Sep IS an open day. Confirmed.**
Operator: 「水曜日」, except February, August, Golden Week and holidays.
Zao Town association: 「水曜日（お盆期間、8月14日、5月の連休、5月1日、連休と祝日の水曜日は営業）」.
Rurubu: 「水曜(祝日の場合は営業)、※2・5・8月の連休中は無休」.
10 September 2026 is a **Thursday** and not a Japanese public holiday, so the regular
Wednesday closure does not touch us and none of the exception windows apply either.

Other verified Zao facts carried into the batch: **¥1,500** for middle school and up, free
below, **cash only at the window — only the shop takes cards**; tel **0224-24-8812**; address
宮城県白石市福岡八宮字川原子11-3 at about **590 m** altitude; **750 parking spaces**; one adult
must accompany each child of elementary age or below; no pets; the **Castle-kun community bus
runs Tuesdays and Fridays only**, so on a Thursday the coach is the only way in or out.

---

## 2. CONTRADICTS §2 — the Ginzan ¥500 shuttle. Both things are true.

§2 says: *"Ginzan shuttle — **not ¥500**; park-and-ride is a WINTER measure, ended 1 Mar 2026."*

**The park-and-ride half of that correction is confirmed, exactly as written.** The
マイカー規制 site (ginzan-artmuseum.com/shuttle/) states:

> 「2026年3月1日（日）をもって銀山温泉マイカー規制は終了しました。」

Its operating windows were autumn `11/1～3・22～24` and winter `12/20～3/1`, and its winter
fares were **time-banded, not ¥500 flat**: 9:00–10:59 ¥800 · 11:00–13:59 ¥500 ·
14:00–18:00 ¥1,000 (the autumn slots were 往復500円). **No 2026-27 period is announced.**
So: do not tell the group there is a winter park-and-ride, and do not quote ¥800/¥1,000.

**But there is a SEPARATE, year-round ¥500 shuttle on the same route, and three official or
official-adjacent sources give it.** This is a different service with a different operator:

1. **Obanazawa City** (city.obanazawa.yamagata.jp/kanko/kankochi/1346):
   > 「大正ろまん館から温泉街入口まで、シャトルバスが運行しています ※1日500円」
2. **Obanazawa City Tourism and Products Association** (obanazawa-kankou.jp/ginzan-onsen/):
   > 「1日乗り放題 500円」, 「大正ロマン館発 9:00（最終17：00発）〜 銀山発 18:00（最終）」,
   > on-demand via a button at the stop.
3. **The operator's own site** (bus.ginzanso.jp), 株式会社銀山荘, tel **080-9283-2268**:
   > 「往復終日乗り放題：一律500円」, route 大正ろまん館前 － 銀山温泉共同駐車場前 － 銀山荘前 －
   > 銀山温泉街入り口, 「大正ろまん館前のご乗車利用は通年 9:00 ～ 17:00」, general operation
   > 9:00–18:00. Pre-school children free. Winter snow can suspend the 銀山荘前–温泉街 leg.

**Reading.** §2's correction is right about the thing it was correcting — the *winter
mycar-regulation park-and-ride* is dead and was never a flat ¥500. It is wrong as a blanket
statement that "the Ginzan shuttle is not ¥500": the **Ginzanso on-demand shuttle is ¥500
all-day, year-round, and is running on 10 September 2026.** Per §4 rule 6 I have **not
overwritten §2** — the batch's `transport` field states the ¥500 year-round shuttle with its
hours and operator *and* states that the winter park-and-ride ended 1 Mar 2026 with no
2026-27 period announced, and points here.

**Why it barely matters operationally:** the group is on a chartered coach. No vehicle of any
size enters the onsen street — Obanazawa City asks the same of coaches:
「大型バスについても、同様に、ご理解・ご協力をお願いします。」 — so the coach waits at Taisho
Roman-kan (**10 coach bays + 100 cars**, lot **08:30–17:30**, building **09:00–17:30**,
tel 0237-53-6727) or at the 共同駐車場 at the street entrance, and the group is dropped and
collected by the coach, not by the ¥500 shuttle. **Nobody should be paying ¥500.** The number
matters only if a splinter group makes its own way back.

---

## 3. Other corrections to existing Day 3 records (all folded into the batch)

- **Nogawa Toufuya opens 08:30, not 07:30.** Rurubu: 「8時30分～売り切れ次第終了」, with
  立食い豆腐 ¥210, **生揚げ ¥250** (so the ¥250 in the app is right), 豆腐テン ¥250,
  address 銀山新畑427, tel 0237-28-2494, 不定休.
  **Unresolved conflict:** Yamagata Prefecture's own tourism page for 野川とうふ
  (yamagatakanko.com/attractions/detail_8837.html) lists the closing day as **月曜日** and
  says 「商品は木綿豆腐1パック160円のみ」 — one ¥160 cotton-tofu pack as the *only* product.
  The two cannot both be current. Thursday is unaffected either way, so I left the record at
  `confidence: medium` with both readings named rather than picking one.
- **Yagihashi Shoten tastings start at ¥300, not ¥500.**
  「日本酒、梅酒、リキュールなどは300円からテイスティングが可能」, bottles
  「地酒銀山温泉各種450～1890円」, 銀山新畑448, tel 0237-28-2035, **08:30–18:00, no closing day**.
  The ¥500 figure in the app appears to be stale.
- **Karinto-manju is NOT shelf-stable and the ¥790 box price is stale.** The maker's own shop
  (meiyuu.com) lists **6 for ¥900**, 10 for ¥1,470, 12 for ¥1,760, 16 for ¥2,330, and the
  boxed product is **frozen: 賞味期限90日間, -18℃以下で保存, 解凍後3日以内**. It will not
  survive five more days on a coach plus a flight to Malaysia. The app's "shelf-stable and
  ideal for carrying back to Malaysia" line is wrong — buy it hot at the counter and eat it.
- **Radium eggs must not fly home.** Aberu Shoten's own shop: red 10-egg box **¥980**,
  「発送日より2週間」 shelf life, cool-shipped in summer. A soft-set egg with a two-week life is
  not hand luggage to Penang. Also: the app says **closed Tuesdays** — that is **not stated on
  the shop's own site**, which gives only 「営業時間／8:00～19:00」 and address 飯坂町湯野字橋本5,
  tel 024-542-2680. Unverified, and irrelevant on a Thursday.
- **Taisho Roman-kan: two different sets of hours.** The lot is **08:30–17:30** (tourism
  association) while the building/shop is **09:00–17:30** and the restaurant is **11:00 to
  last order 15:00** (venue's own site). The app-relevant one is the lot. The shop page also
  gives 「9:00～17：30（レストラン10:00～16:00）」, which disagrees with the restaurant page's
  11:00/LO15:00 — I used the restaurant page.
- **The 12:00 "Tempura Soba Set" has a named home, but it is an inference.** Taisho Roman-kan's
  restaurant serves 天ぷらもりそば / 天ぷらかけそば **¥1,800**, 板そば ¥1,400, にしんそば ¥1,200,
  中華そば ¥900, and group 御膳 sets ¥2,100 / ¥2,500 / ¥2,750 / ¥3,000 — a coach lot with a
  group-set restaurant, 10 minutes from the street, on the road to Zao. On the street itself,
  **伊豆の華** (銀山新畑440, tel 0237-28-2036, **11:00–18:00 LO 17:30, closed Wednesdays**) is the
  only house serving the same dish, but it opens at 11:00, i.e. in the last 30 minutes of the
  stop. **The app names no lunch venue**, so both are flagged as inference in the batch.
- **Yoshikawaya breakfast is 07:00, not 07:30.** The hotel's own page: dinner **18:00**,
  breakfast **07:00**, check-in **15:00–18:00**, check-out **10:00**. The app prints breakfast
  at 07:30 with the coach at 08:30. Also: **check-in officially closes at 18:00** and the
  hotel's phone line is answered **09:00–18:00** — so a coach running late must call from the
  road, not on arrival. Pick-ups from Iizaka Onsen Station are 14:50 and 15:15 scheduled,
  on-call after, and **stop at 18:00**; returns 07:30–11:00 every 30 min by reservation.
  150 free parking spaces. Full name 「かむろみの郷 穴原温泉 匠のこころ 吉川屋」, tel 024-542-2226.
- **Tennoji Anabara-yu — the app's hours are right.** Fukushima City official: Mon & Fri
  「午前6時から午後1時まで」, Tue/Thu/Sat/Sun 「午後1時から午後9時まで」, closed 水曜日,
  「12歳以上 400円」/「1歳以上12歳未満 200円」, 「最終入館時間は、営業終了時間の20分前」,
  tel 024-542-0400. So Thursday evening 13:00–21:00 (last entry 20:40) **and** Friday from
  06:00 both hold, exactly as briefed.
- **Gyoza no Terui, Iizaka branch — confirmed open on the Thursday.** Own site: 飯坂町錦町1-21,
  tel 024-542-4447, 「17：00～21：00」 or until sold out, **closed Wednesdays**, 15 parking spaces.
  The ¥1,200 disc price is **not on the restaurant's own site** — carried at medium confidence.

---

## 4. New material worth knowing (not corrections)

- **The official Ginzan walking courses**, from the operator's own walk page — these are what
  the two `subRoutes` are built on: 「ゆったり散策コース（約1.9km 約90分）」,
  「銀鉱洞直行コース（約1.4km 約60分）」, 「滝見コース（約0.8km 約20分）」. The tourism
  association lists four model courses, 20 min to 1h40, 0.8–4 km.
- **銀鉱洞 / 延沢銀山遺跡 is open in September** and almost nobody walks to it: free, sunrise to
  sunset, **15 minutes on foot** past the falls, two lit entrances, and closed only 「初雪から
  みどりの日（山開き）まで」 — i.e. first snow to Greenery Day. It is the thing the name *Ginzan*
  actually refers to.
- **An official 2-hour guided Ginzan walk exists at ¥7,000 per guide**, booked through
  Obanazawa City Tourism and Products Association (**0237-23-4567**, 09:00–17:00) at least two
  weeks ahead. Two hours is exactly this stop's length. Route: 「白銀橋から出発し、足湯「和楽足湯」、
  ガス灯、旅館の歴史を聞きながら、白銀の滝の近くまで行って」.
- **Waraku Ashiyu is 06:00–22:00 and free**, per Obanazawa City. Confirmed as briefed.
- **The fox-holding experience is unavailable to this group.** It runs **twice a day, 11:00 and
  14:00**, ~5 minutes, **¥1,000 cash** — the coach arrives at 15:10. Say it on the coach rather
  than letting 35 people queue at a closed counter. (Medium confidence — see §5.)
- **Yoshikawaya has more baths than the briefing lists**: as well as the two riverside
  open-airs, two large indoor baths **藤太の湯** and **弁天の湯**, all four 14:00–24:00 and
  05:00–10:00 with the evening/morning gender swap, plus a reservable barrier-free private bath
  **湯野〜YUNO〜** 06:00–23:00 in hourly slots. The **book lounge is 15:00–23:00 AND 07:00–10:00** —
  the morning session is missing from the briefing and it covers the gap between the 07:00
  breakfast and the 08:30 coach.
- **The hotel's own 3F shop stocks the radium eggs**, akabeko, Kitakata ramen, gyutan and cherry
  sweets. Nobody needs a taxi to Iizaka to buy the local souvenir.
- **Yoshikawaya is built for groups**: a 529 m² convention hall divisible in three (450 theatre,
  240–400 at round tables), the 320-mat **天翔** hall (450 dining), the 88-mat **羽衣** hall
  (100 dining) and six 16–20 mat **花の庄** private rooms at 15–24 each. 35 people fit in 羽衣
  or across two 花の庄 rooms.
- **Obanazawa watermelon is over by 10 September.** Peak shipping is
  「7月下旬から8月中旬にかけて」. The produce stand at Taisho Roman-kan's door will not have the
  thing Obanazawa is nationally famous for. Noted in the place record so nobody promises it.
- **Zao Fox Village visitor rules, from Discover SENDAI's official listing** — these are the
  operator's own reasons, which is why they are worth repeating to the group: do not touch
  ("they may bite"); **do not crouch or sit down** ("Spending a long time at eye level with the
  foxes is dangerous, as they may gather and act aggresively towards you"); feed only in the
  designated feeding area ("they will learn to jump on humans"); and **"Foxes have the tendency
  to break and bury objects they find on the ground, so make sure not to drop anything."**

---

## 5. What I could NOT verify

1. **The dangling-straps rule, as a quotable operator rule.** The task states it and I have put
   it in `outfitByStop` for Zao Fox Village, but I could not fetch the operator's own cautions
   page — `zao-fox-village.com/descriptions/cautions-when-entering` returns ROBOTS_DISALLOWED /
   "failed to fetch or parse robots.txt" from this sandbox on every attempt, http and https, and
   direct curl is blocked by the host allowlist. The site *root* fetches fine but carries no rules
   list. What I *can* source is the adjacent official rule — foxes "break and bury objects they
   find on the ground, so make sure not to drop anything" — plus don't-touch, don't-crouch and
   feeding-area-only. **The strap prohibition itself rests on the briefing, not on a page I read.**
   It is sound advice either way; if it is going on a printed rule card, confirm it by phone on
   0224-24-8812.
2. **Zao Fox Village group rate: none published.** No group discount appears on the operator's
   page or on any city/prefectural listing. `groupRate` records that it is a flat ¥1,500 cash —
   **¥52,500 in notes for 35 people**, which is worth telling the guide in advance.
3. **The fox-holding times and ¥1,000 price** come from a detailed Japanese visitor guide
   (5ing-myway.com), not the operator, because the operator's own notice pages
   (`/archives/5558`, `/archives/facilities/キツネ抱っこ体験のお知らせ！`) are behind the same
   robots failure. Marked medium confidence. Confirm by phone before briefing.
4. **No individual Ginzan Shinbata building resolves in any geocoder.** Japan's official GSI
   geocoder returns only the 大字 centroid for 銀山新畑 — `[140.547714, 38.577953]`, which is
   ~1.5 km east of the onsen street and useless. So the new street shops (伊豆の華, 八木橋商店,
   しろがね, あいらすげーな, 銀鉱洞) carry the **verified 銀山温泉 point as an explicit stand-in**,
   marked `approximate` with a confidenceNote naming exactly that. None of them is invented.
5. **白銀の滝 is a trap in the geocoder.** GSI resolves 「白銀の滝」 to **Hokkaido**
   `[141.336356, 43.731408]` — Sounkyo's waterfall of the same name. Do not let a later session
   "fix" the Ginzan falls coordinate with it. I kept the seed's verified 38.572292, 140.532444.
6. **大正ろまん館 does not resolve either** — GSI returns only 高畠華宵大正ロマン館 in Ehime. Its
   address 上柳渡戸字十分一364-3 resolves to the 大字 centroid `[140.507278, 38.57444]`, ~2 km from
   the seed's verified point, so I left the seed's coordinate alone.
7. **Zao Fox Village has no address-level geocode.** GSI resolves 宮城県白石市福岡八宮字川原子11-3
   only to 「宮城県白石市福岡八宮川原」 `[140.603226, 38.025909]` — the wrong sub-district, ~8 km
   east near Shiroishi. The enclosure records therefore use the map point the **official Tohoku
   tourism site embeds** for the venue, `38.040829, 140.53036`, which corroborates the seed's
   `38.040914, 140.530264` to within ~15 m. Both are marked `approximate`, not verified — the
   coordinate is a map-embed centre, not a resolved address.
8. **No licensable image for any Day 3 place, so the `images` key is omitted everywhere.**
   Wikimedia Commons, the Wikimedia/Wikipedia APIs and Openverse are all blocked from this
   sandbox, and none of the venue or tourism-board pages I *could* read grants reuse in terms I
   can point at. Per §4 rule 7 I attached nothing rather than attaching something unlicensed;
   the app's image-search fallback covers it.
9. **Yoshikawaya's private-bath hire charge, the 3F shop's hours, and Terui's ¥1,200 disc price**
   are not published on the respective operators' own pages.
10. **The 12:00 lunch venue is not named by the app at all** (see §3). Everything in the batch
    about it is labelled inference.
