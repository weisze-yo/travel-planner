import Foundation

/// The demo trip from the Claude Design prototype, written to Firestore the
/// first time an account opens the app. Names are the design's fictional ones;
/// coordinates are real central-Tokyo values so the map has real streets under
/// them — replace both when a live agent itinerary is imported.
enum SeedData {

    static let tripID = "meridian-city"

    // MARK: Trip

    static var trip: Trip {
        Trip(
            id: tripID,
            name: "Meridian City · Group Tour",
            code: "MC",
            dateRange: "Mar 12–17 · agent itinerary · 6 days",
            dayCount: 6,
            currentDay: 3,
            departsInDays: 11,
            startDate: Calendar.current.date(from: DateComponents(year: 2026, month: 3, day: 12)),
            currencySymbol: "¥",
            homeCurrencyCode: "RM",
            homeCurrencyRate: 33.7,
            hotelName: "Hotel Meridian",
            stationName: "Nishi Sta., Exit B",
            prepCategories: ["Documents", "Outfits", "Carry-on", "Electronics"],
            weather: weather,
            latitude: 35.6800,
            longitude: 139.7010
        )
    }

    static let weather: [DayWeather] = [
        DayWeather(dayNumber: 1, icon: "☀", high: 21, low: 14, rainChance: 0, summary: "clear"),
        DayWeather(dayNumber: 2, icon: "⛅", high: 19, low: 13, rainChance: 10, summary: "partly cloudy"),
        DayWeather(dayNumber: 3, icon: "☁", high: 16, low: 13, rainChance: 20, summary: "overcast"),
        DayWeather(dayNumber: 4, icon: "🌧", high: 14, low: 11, rainChance: 80, summary: "rain"),
        DayWeather(dayNumber: 5, icon: "⛅", high: 18, low: 12, rainChance: 10, summary: "partly cloudy"),
        DayWeather(dayNumber: 6, icon: "☀", high: 20, low: 13, rainChance: 0, summary: "clear")
    ]

    // MARK: Days

    private static let dateLabels = [
        "Mar 12 · Thu", "Mar 13 · Fri", "Mar 14 · Sat",
        "Mar 15 · Sun", "Mar 16 · Mon", "Mar 17 · Tue"
    ]

    static var days: [TripDay] {
        (1...6).map { n in
            TripDay(
                id: "day-\(n)",
                dayNumber: n,
                dateLabel: dateLabels[n - 1],
                shortDate: dateLabels[n - 1].components(separatedBy: " · ").first ?? dateLabels[n - 1],
                areaSpan: n == 3 ? "Old Quarter to Skyline" : "",
                items: n == 3 ? dayThreeItems : []
            )
        }
    }

    static let dayThreeItems: [PlanItem] = [
        PlanItem(
            id: "depart",
            time: "08:30",
            name: "Depart Hotel Meridian",
            note: "Coach bay 2 · guide Ms. Ren",
            latitude: 35.6900, longitude: 139.6960
        ),
        PlanItem(
            id: "lumen",
            time: "09:15",
            durationLabel: "45m",
            name: "Lumen Crossing",
            subtitle: "Scramble crossing · Old Quarter",
            note: "Crossing sweep every 2 min; guide talks 10 min then free on the plaza.",
            summary: "A five-way scramble crossing under video walls. The sweep runs about every two minutes; the guide talks for ten and then leaves the group on the plaza.",
            windowLabel: "09:15 – 10:00",
            chips: ["2 must-see shots"],
            latitude: 35.6918, longitude: 139.7005
        ),
        PlanItem(
            id: "ashgate",
            time: "10:30",
            durationLabel: "1h",
            name: "Ashgate Shrine",
            subtitle: "Shrine complex · Old Quarter",
            note: "Covered shoulders. Stamp book ¥500 at the side office.",
            summary: "A working shrine with a cedar avenue and a side office selling stamp books. Shoulders must be covered inside the inner gate.",
            windowLabel: "10:30 – 11:30",
            latitude: 35.6870, longitude: 139.7030
        ),
        PlanItem(
            id: "harbour",
            time: "12:00",
            durationLabel: "1h",
            name: "Harbour Steps · set lunch",
            subtitle: "Group restaurant · Harbourside",
            note: "Included. Vegetarian on request the night before.",
            summary: "Set lunch included in the tour price. Vegetarian and no-fish plates need to be requested the night before.",
            windowLabel: "12:00 – 13:00",
            latitude: 35.6835, longitude: 139.7060
        ),
        PlanItem(
            id: "nishi",
            time: "13:30",
            durationLabel: "2h15",
            name: "Nishi Market",
            subtitle: "Covered market, 4 blocks · Old Quarter",
            note: "Guide releases the group at the north gate; back at the coach 15:45.",
            summary: "A 90-year-old covered market of about 180 stalls: produce and dried goods at the north end, kitchenware and knives in the middle aisle, street food and standing bars to the south. Busiest 12:00–14:00; many stalls start closing at 17:00.",
            windowLabel: "13:30 – 15:45",
            chips: ["4 shopping items", "4 must-see shots"],
            placeID: "nishi",
            essentials: nishiEssentials,
            latitude: 35.6800, longitude: 139.7010
        ),
        PlanItem(
            id: "mysub",
            time: "13:45",
            durationLabel: "1h47",
            name: "My sub route · 3 stops",
            note: "Kōri Dessert Bar → Canal Overlook → Paper & Ink.",
            chips: ["1.4 km walk"],
            kind: .sub,
            isSubRouteSummary: true,
            latitude: 35.6810, longitude: 139.7002
        ),
        PlanItem(
            id: "skyline",
            time: "16:00",
            durationLabel: "1h",
            name: "Skyline Deck",
            subtitle: "Observation deck · Skyline",
            note: "Ticket held by agent. Sunset 18:04 — deck faces west.",
            summary: "West-facing observation deck on the 41st floor. The agent holds the group ticket; sunset is 18:04 and the deck gets windy after dark.",
            windowLabel: "16:00 – 17:00",
            chips: ["1 must-see shot"],
            latitude: 35.6845, longitude: 139.6935
        ),
        PlanItem(
            id: "hotel",
            time: "18:00",
            name: "Hotel Meridian",
            note: "Dinner not included. Two ramen shops within 300 m.",
            latitude: 35.6900, longitude: 139.6960
        )
    ]

    static let nishiEssentials: [EssentialRow] = [
        EssentialRow(key: "Hours", value: "09:00 – 18:00", detail: "Closed Wednesdays · south food aisle open to 21:00"),
        EssentialRow(key: "Phone", value: "+00 2 4471 9820", detail: "Market office, English 10:00–16:00"),
        EssentialRow(key: "Website", value: "nishimarket.example", detail: "Stall directory and closure notices"),
        EssentialRow(key: "Tickets", value: "Free entry", detail: "Knife-sharpening demo ¥800, 14:00 daily"),
        EssentialRow(key: "Transport", value: "Line 3 → Nishi Sta., Exit B", detail: "4 min walk · lift at Exit B · taxi rank on the east side"),
        EssentialRow(key: "Payment", value: "Cash preferred", detail: "IC card at ~40 stalls · one ATM at the north gate"),
        EssentialRow(key: "Facilities", value: "Toilets, lockers, seating", detail: "Coin lockers ¥400 at north gate, cash only"),
        EssentialRow(key: "Language", value: "Partial English signs", detail: "Point-and-pay works; prices per 100 g")
    ]

    // MARK: Nearby places (all anchored on Nishi Market)

    static let places: [Place] = [
        Place(id: "ramen", anchorPlaceID: "nishi", name: "Standing Ramen No.7", category: .food,
              priceTier: "¥", stayMinutes: 20, legs: [TransportLeg(mode: .walk, minutes: 3)],
              note: "Six seats, no queue after 14:00", latitude: 35.6806, longitude: 139.7016),
        Place(id: "kori", anchorPlaceID: "nishi", name: "Kōri Dessert Bar", category: .food,
              priceTier: "¥¥", stayMinutes: 25, legs: [TransportLeg(mode: .walk, minutes: 4)],
              note: "Shaved ice with seasonal fruit", latitude: 35.6810, longitude: 139.7002),
        Place(id: "canal", anchorPlaceID: "nishi", name: "Canal Overlook", category: .sight,
              priceTier: "Free", stayMinutes: 15, legs: [TransportLeg(mode: .walk, minutes: 5)],
              note: "Bridge 2 north rail", latitude: 35.6788, longitude: 139.7024),
        Place(id: "pharm", anchorPlaceID: "nishi", name: "Green Cross Pharmacy", category: .cosme,
              priceTier: "¥", stayMinutes: 20, legs: [TransportLeg(mode: .walk, minutes: 2)],
              note: "Sunscreen, plasters, eye drops", latitude: 35.6803, longitude: 139.7005),
        Place(id: "cosme", anchorPlaceID: "nishi", name: "Cosme Lab flagship", category: .cosme,
              priceTier: "¥¥", stayMinutes: 35,
              legs: [TransportLeg(mode: .walk, minutes: 4), TransportLeg(mode: .train, minutes: 6)],
              note: "Tax-free counter on level 2", latitude: 35.6852, longitude: 139.7100),
        Place(id: "paper", anchorPlaceID: "nishi", name: "Paper & Ink Stationery", category: .shopping,
              priceTier: "¥", stayMinutes: 20, legs: [TransportLeg(mode: .walk, minutes: 6)],
              note: "Letterpress cards, brush pens", latitude: 35.6784, longitude: 139.6996),
        Place(id: "garden", anchorPlaceID: "nishi", name: "Stone Lantern Garden", category: .sight,
              priceTier: "¥", stayMinutes: 30, legs: [TransportLeg(mode: .walk, minutes: 7)],
              note: "Quiet pond loop, free toilets", latitude: 35.6820, longitude: 139.7038),
        Place(id: "aoi", anchorPlaceID: "nishi", name: "Aoi Camera Alley", category: .shopping,
              priceTier: "¥¥¥", stayMinutes: 35, legs: [TransportLeg(mode: .walk, minutes: 8)],
              note: "Eleven used-gear shops in one lane", latitude: 35.6776, longitude: 139.7042),
        Place(id: "bath", anchorPlaceID: "nishi", name: "Old Quarter Bathhouse", category: .rest,
              priceTier: "¥", stayMinutes: 60, legs: [TransportLeg(mode: .walk, minutes: 9)],
              note: "Towel rental ¥200", latitude: 35.6772, longitude: 139.6982),
        Place(id: "kimono", anchorPlaceID: "nishi", name: "Indigo Kimono Rental", category: .cloth,
              priceTier: "¥¥", stayMinutes: 45, legs: [TransportLeg(mode: .walk, minutes: 7)],
              note: "Two-hour rental, dressing included", latitude: 35.6818, longitude: 139.6975),
        Place(id: "arcade", anchorPlaceID: "nishi", name: "Nishi Craft Arcade", category: .shopping,
              priceTier: "¥¥", stayMinutes: 40, legs: [TransportLeg(mode: .walk, minutes: 11)],
              note: "Ceramics and indigo cloth", latitude: 35.6836, longitude: 139.7052),
        Place(id: "dept", anchorPlaceID: "nishi", name: "Kaede Department Store", category: .cloth,
              priceTier: "¥¥¥", stayMinutes: 60,
              legs: [TransportLeg(mode: .walk, minutes: 5), TransportLeg(mode: .train, minutes: 8), TransportLeg(mode: .walk, minutes: 3)],
              note: "Six floors, basement food hall", latitude: 35.6905, longitude: 139.7005),
        Place(id: "outlet", anchorPlaceID: "nishi", name: "Riverside Outlet", category: .cloth,
              priceTier: "¥¥", stayMinutes: 75,
              legs: [TransportLeg(mode: .walk, minutes: 3), TransportLeg(mode: .bus, minutes: 22)],
              note: "Last-season stock, 40–60% off", latitude: 35.6680, longitude: 139.7180),
        Place(id: "tower", anchorPlaceID: "nishi", name: "Hillside Tower", category: .sight,
              priceTier: "¥¥", stayMinutes: 50,
              legs: [TransportLeg(mode: .walk, minutes: 6), TransportLeg(mode: .train, minutes: 14), TransportLeg(mode: .bus, minutes: 9)],
              note: "Observation deck, faces west", latitude: 35.6586, longitude: 139.7454)
    ]

    // MARK: Sub route

    static var subRoute: SubRoute {
        SubRoute(
            id: "day-3",
            dayNumber: 3,
            anchorPlanItemID: "nishi",
            anchorName: "Nishi Market",
            startMinutes: 13 * 60 + 45,
            deadlineMinutes: 15 * 60 + 45,
            placeIDs: ["kori", "canal", "paper"],
            returnTarget: .coach,
            returnMinutes: 8
        )
    }

    // MARK: Shopping

    static var shopping: [ShoppingItem] {
        var items: [ShoppingItem] = [
            ShoppingItem(id: "k1", name: "Kitchen knife", detail: "Middle aisle, stall 44",
                         placeLabel: "Nishi Market", placeWhen: "Day 3 · today, 13:30 – 15:45",
                         groupOrder: 0, order: 0, estimate: 5000),
            ShoppingItem(id: "k2", name: "Dried scallop", detail: "North end · sold per 100 g",
                         placeLabel: "Nishi Market", placeWhen: "Day 3 · today, 13:30 – 15:45",
                         groupOrder: 0, order: 1, estimate: 1800),
            ShoppingItem(id: "k3", name: "Ceramic cups ×4", detail: "Craft arcade, 11 min walk",
                         placeLabel: "Nishi Market", placeWhen: "Day 3 · today, 13:30 – 15:45",
                         groupOrder: 0, order: 2, estimate: 3200),
            ShoppingItem(id: "k4", name: "Yuzu pepper", detail: "Any dried-goods stall",
                         placeLabel: "Nishi Market", placeWhen: "Day 3 · today, 13:30 – 15:45",
                         groupOrder: 0, order: 3, estimate: nil),
            ShoppingItem(id: "k5", name: "35mm prime lens, used", detail: "Compare 3 shops before buying",
                         placeLabel: "Aoi Camera Alley", placeWhen: "Day 3 · sub route, optional",
                         badge: .ifTime, groupOrder: 1, order: 0, estimate: 20000),
            ShoppingItem(id: "k6", name: "Camera strap", detail: "Leather, second lane",
                         placeLabel: "Aoi Camera Alley", placeWhen: "Day 3 · sub route, optional",
                         badge: .ifTime, groupOrder: 1, order: 1, estimate: nil),
            ShoppingItem(id: "k7", name: "Gift boxes ×3", detail: "Cheaper in town, but safe fallback",
                         placeLabel: "Airport, before security", placeWhen: "Day 6 · 3 h layover",
                         badge: .lastChance, groupOrder: 2, order: 0, estimate: 4500)
        ]
        var matcha = ShoppingItem(
            id: "k8", name: "Matcha tin", detail: "Duty-free counter B",
            placeLabel: "Airport, before security", placeWhen: "Day 6 · 3 h layover",
            badge: .lastChance, groupOrder: 2, order: 1, estimate: 2600
        )
        matcha.paidAmount = 2400
        matcha.payment = .card
        matcha.bought = true
        matcha.boughtOn = Calendar.current.date(from: DateComponents(year: 2026, month: 3, day: 11))
        items.append(matcha)
        return items
    }

    // MARK: Must-see

    static let mustSee: [MustSeeShot] = [
        MustSeeShot(id: "m1", placeID: "nishi", title: "Red lantern run, north gate", tag: "ICONIC",
                    summary: "A full row of old lanterns from the north gate down the middle aisle — the shot this market is known for.",
                    whereToFind: "20 m inside the north gate", order: 0,
                    latitude: 35.6804, longitude: 139.7012),
        MustSeeShot(id: "m2", placeID: "nishi", title: "Canal from Bridge 2", tag: "EVENING",
                    summary: "The market’s steel roofs reflected in the water; quieter towards evening.",
                    whereToFind: "Bridge 2, north rail", order: 1,
                    latitude: 35.6788, longitude: 139.7024),
        MustSeeShot(id: "m3", placeID: "nishi", title: "The knife sharpener’s bench", tag: "14:00 DAILY",
                    summary: "Sparks and spray during the demo. Shoot from the side, not the front.",
                    whereToFind: "Middle aisle, stall 44", order: 2,
                    latitude: 35.6800, longitude: 139.7009),
        MustSeeShot(id: "m4", placeID: "nishi", title: "South standing bars", tag: "NIGHT",
                    summary: "Lights come on after 17:00 — steam, crowd and signage all in one frame.",
                    whereToFind: "South exit", order: 3,
                    latitude: 35.6795, longitude: 139.7008)
    ]

    /// Weather-driven outfit advice for the must-see screen.
    static let outfitSuggestion = "16 °C and overcast on this day, so a mid-weight layer works. The market is grey stone and steel, so one solid warm tone reads best — rust, cream or mustard. Flat shoes: the aisles are wet near the fish stalls."
    static let outfitSuggestionChips = ["rust coat", "cream knit", "flat shoes"]

    // MARK: Prep

    static let prep: [PrepItem] = [
        PrepItem(id: "p1", category: "Documents", categoryOrder: 0, order: 0, name: "Passport + 2 copies", packed: true),
        PrepItem(id: "p2", category: "Documents", categoryOrder: 0, order: 1, name: "Agent voucher, printed",
                 why: "Coach driver checks paper only", packed: true),
        PrepItem(id: "p3", category: "Documents", categoryOrder: 0, order: 2, name: "Travel insurance card"),

        PrepItem(id: "p4", category: "Outfits", categoryOrder: 1, order: 0, name: "Rust coat",
                 why: "Must-see shots: Canal Overlook, Skyline Deck"),
        PrepItem(id: "p5", category: "Outfits", categoryOrder: 1, order: 1, name: "Cream knit"),
        PrepItem(id: "p6", category: "Outfits", categoryOrder: 1, order: 2, name: "Shawl for covered shoulders",
                 why: "Ashgate Shrine, Day 3"),
        PrepItem(id: "p7", category: "Outfits", categoryOrder: 1, order: 3, name: "Flat shoes, broken in",
                 why: "12 km walking on Day 2", packed: true),

        PrepItem(id: "p8", category: "Carry-on", categoryOrder: 2, order: 0, name: "Folding umbrella",
                 why: "Day 4: 80% rain"),
        PrepItem(id: "p9", category: "Carry-on", categoryOrder: 2, order: 1, name: "Coin purse for cash stalls",
                 why: "Nishi Market is cash-first"),
        PrepItem(id: "p10", category: "Carry-on", categoryOrder: 2, order: 2, name: "Foldable tote for shopping"),
        PrepItem(id: "p11", category: "Carry-on", categoryOrder: 2, order: 3, name: "Painkillers, plasters", packed: true),

        PrepItem(id: "p12", category: "Electronics", categoryOrder: 3, order: 0, name: "Type-A plug adapter ×2", packed: true),
        PrepItem(id: "p13", category: "Electronics", categoryOrder: 3, order: 1, name: "Power bank 10,000 mAh",
                 why: "Carry-on only", packed: true),
        PrepItem(id: "p14", category: "Electronics", categoryOrder: 3, order: 2, name: "Camera + 2 batteries"),
        PrepItem(id: "p15", category: "Electronics", categoryOrder: 3, order: 3, name: "Offline map pack downloaded")
    ]

    // MARK: Log

    static var log: [LogEntry] {
        [
            LogEntry(
                id: "day-2",
                dayNumber: 2,
                dayLabel: "Day 2",
                dateLabel: "Mar 13",
                meta: "6 stops · 12.4 km",
                destinationLabel: "Ashgate Shrine · Harbour Steps · Hillside Tower",
                text: "Hill walk was steeper than the note said. Got the shrine gate shot at 07:40 with nobody in frame. Missed the dessert bar — closed on Fridays.",
                photoCount: 24,
                chips: [
                    LogChip(label: "2 of 3 must-see ✓", tone: .jade),
                    LogChip(label: "¥8,150 spent", tone: .neutral),
                    LogChip(label: "1 sub route walked", tone: .neutral)
                ]
            ),
            LogEntry(
                id: "day-3",
                dayNumber: 3,
                dayLabel: "Day 3",
                dateLabel: "Today",
                meta: "in progress",
                metaIsLive: true,
                destinationLabel: "Nishi Market",
                destinationPlaceID: "nishi",
                text: "3 stops done, 3 to go. Add today’s note from the place screen.",
                photoCount: 0,
                chips: [LogChip(label: "note pending", tone: .amber)]
            )
        ]
    }

    static let recapText = "Route map, all photos, what you bought and what you paid, plus the places you saved but never reached — carried into your next trip."
}
