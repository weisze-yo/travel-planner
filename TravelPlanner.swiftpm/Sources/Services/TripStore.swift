import SwiftUI
import Foundation
import CoreLocation

// MARK: - Derived shapes the screens read

struct ScheduledStop: Identifiable, Hashable {
    var id: String { place.id }
    let index: Int
    let place: Place
    /// Minutes past midnight the traveller gets there.
    let arrival: Int

    var arrivalLabel: String { Fmt.clock(arrival) }

    var metaLine: String {
        let legs = place.legs.map { "\($0.mode.icon)\($0.minutes)" }.joined(separator: " + ")
        return "\(legs) · stay \(Fmt.duration(place.stayMinutes)) · \(place.priceTier)"
    }
}

struct SubRouteSchedule {
    var stops: [ScheduledStop] = []
    /// Every leg plus the journey back — the design labels this MOVING.
    var movingMinutes: Int = 0
    var stayMinutes: Int = 0
    var returnClock: Int = 0
    var bufferMinutes: Int = 0
    var startMinutes: Int = 0

    var isTight: Bool { bufferMinutes < 10 }
    var isLate: Bool { bufferMinutes < 0 }

    var bufferLine: String {
        bufferMinutes >= 0
            ? "\(bufferMinutes) min before departure"
            : "\(-bufferMinutes) min LATE"
    }

    /// Rough distance at a 80 m/min walking pace, for the plan-row chip.
    var walkDistanceLabel: String {
        let metres = Double(movingMinutes) * 80
        return String(format: "%.1f km walk", metres / 1000)
    }
}

struct ShoppingGroup: Identifiable, Hashable {
    var id: String { placeLabel }
    let placeLabel: String
    let when: String
    let badge: ShoppingBadge
    let items: [ShoppingItem]
}

struct PrepGroup: Identifiable, Hashable {
    var id: String { title }
    let title: String
    let items: [PrepItem]

    var countLabel: String { "\(items.filter(\.packed).count)/\(items.count)" }
}

enum NearbySort: String, CaseIterable {
    case travelTime, stayTime

    var label: String {
        switch self {
        case .travelTime: return "Travel time"
        case .stayTime: return "Stay time"
        }
    }
}

// MARK: - Store

/// One source of truth for the trip. Every mutation updates local state and
/// writes through to Firestore, which then echoes back through the listeners.
@MainActor
final class TripStore: ObservableObject {

    @Published private(set) var trip: Trip?
    @Published private(set) var days: [TripDay] = []
    @Published private(set) var places: [Place] = []
    @Published private(set) var subRoutes: [SubRoute] = []
    @Published private(set) var shopping: [ShoppingItem] = []
    @Published private(set) var mustSee: [MustSeeShot] = []
    @Published private(set) var prep: [PrepItem] = []
    @Published private(set) var log: [LogEntry] = []
    @Published private(set) var outfits: [OutfitRecord] = []

    @Published var selectedDay: Int = 3
    @Published var isEditingPlan = false
    @Published private(set) var isLoaded = false

    private var repo: TripRepository?

    // MARK: Lifecycle

    func attach(uid: String) async {
        guard repo == nil else { return }
        let repo = TripRepository(uid: uid)
        self.repo = repo

        try? await repo.seedIfNeeded()

        repo.observeTrip { [weak self] trip in
            guard let self else { return }
            let firstLoad = self.trip == nil
            self.trip = trip
            if firstLoad {
                self.selectedDay = trip.currentDay
                Task { await self.refreshWeather() }
            }
            self.isLoaded = true
        }
        repo.observe(TripRepository.Collections.days, as: TripDay.self) { [weak self] value in
            self?.days = value.sorted { $0.dayNumber < $1.dayNumber }
        }
        repo.observe(TripRepository.Collections.places, as: Place.self) { [weak self] value in
            self?.places = value
        }
        repo.observe(TripRepository.Collections.subRoutes, as: SubRoute.self) { [weak self] value in
            self?.subRoutes = value
        }
        repo.observe(TripRepository.Collections.shopping, as: ShoppingItem.self) { [weak self] value in
            self?.shopping = value
        }
        repo.observe(TripRepository.Collections.mustSee, as: MustSeeShot.self) { [weak self] value in
            self?.mustSee = value.sorted { $0.order < $1.order }
        }
        repo.observe(TripRepository.Collections.prep, as: PrepItem.self) { [weak self] value in
            self?.prep = value
        }
        repo.observe(TripRepository.Collections.log, as: LogEntry.self) { [weak self] value in
            self?.log = value.sorted { $0.dayNumber < $1.dayNumber }
        }
        repo.observe(TripRepository.Collections.outfits, as: OutfitRecord.self) { [weak self] value in
            self?.outfits = value
        }
    }

    /// Pulls a real forecast when the trip is close enough for one to exist.
    func refreshWeather() async {
        guard var trip, let start = trip.startDate else { return }
        guard WeatherService.isWithinHorizon(startDate: start, days: trip.dayCount) else { return }
        do {
            let forecast = try await WeatherService().forecast(
                latitude: trip.latitude,
                longitude: trip.longitude,
                startDate: start,
                days: trip.dayCount
            )
            guard !forecast.isEmpty else { return }
            trip.weather = forecast
            trip.weatherUpdatedAt = Date()
            self.trip = trip
            repo?.save(trip)
        } catch {
            // Keep the last known figures; the strip shows what it has.
        }
    }

    // MARK: Days and itinerary

    var day: TripDay? { days.first { $0.dayNumber == selectedDay } }

    func day(_ number: Int) -> TripDay? { days.first { $0.dayNumber == number } }

    var weatherToday: DayWeather? { trip?.weather(forDay: selectedDay) }

    func weather(_ dayNumber: Int) -> DayWeather? { trip?.weather(forDay: dayNumber) }

    var weatherSourceLine: String {
        guard let updated = trip?.weatherUpdatedAt else { return "Forecast" }
        let hours = Int(Date().timeIntervalSince(updated) / 3600)
        if hours < 1 { return "Forecast, updated just now" }
        return "Forecast, updated \(hours) h ago"
    }

    /// Numbers every main-route stop of the day in order. The hotel appears at
    /// both ends of the day, so pins are deduplicated by location and keep the
    /// first number — which is what makes Nishi Market stop 5.
    func mainStopNumbers(for day: TripDay) -> [String: Int] {
        var numbers: [String: Int] = [:]
        var n = 0
        for item in day.activeItems where item.kind == .main {
            n += 1
            numbers[item.id] = n
        }
        return numbers
    }

    func planItem(_ id: String) -> PlanItem? {
        for day in days {
            if let hit = day.items.first(where: { $0.id == id }) { return hit }
        }
        return nil
    }

    /// The stop the sub route hangs off — the one with slack in the day.
    var anchorItem: PlanItem? {
        guard let day else { return nil }
        if let route = subRoute(forDay: selectedDay),
           let hit = day.items.first(where: { $0.id == route.anchorPlanItemID }) {
            return hit
        }
        return day.activeItems.first { $0.kind == .main && $0.placeID != nil }
    }

    /// The "My sub route · N stops" row reads from the live sub route rather
    /// than whatever was stored, so editing the loop updates the day.
    func decorated(_ item: PlanItem) -> PlanItem {
        guard item.isSubRouteSummary, let route = currentSubRoute else { return item }
        let schedule = schedule(for: route)
        var copy = item
        copy.time = Fmt.clock(route.startMinutes)
        copy.name = "My sub route · \(schedule.stops.count) stops"
        copy.note = schedule.stops.isEmpty
            ? "Add places from Nearby"
            : schedule.stops.map(\.place.name).joined(separator: " → ")
        copy.durationLabel = Fmt.duration(schedule.movingMinutes + schedule.stayMinutes)
        copy.chips = schedule.stops.isEmpty ? [] : [schedule.walkDistanceLabel]
        return copy
    }

    func movePlanItem(in dayNumber: Int, from source: IndexSet, to destination: Int) {
        guard var target = day(dayNumber) else { return }
        var active = target.activeItems
        active.move(fromOffsets: source, toOffset: destination)
        let archived = target.archivedItems
        target.items = active + archived
        write(target)
    }

    /// Drops the dragged stop into the slot the traveller let go over.
    func movePlanItem(_ id: String, onto targetID: String, in dayNumber: Int) {
        guard id != targetID, var target = day(dayNumber) else { return }
        var active = target.activeItems
        guard let from = active.firstIndex(where: { $0.id == id }),
              let to = active.firstIndex(where: { $0.id == targetID }) else { return }
        let moved = active.remove(at: from)
        active.insert(moved, at: to)
        target.items = active + target.archivedItems
        write(target)
    }

    func archivePlanItem(_ id: String, in dayNumber: Int) {
        guard var target = day(dayNumber),
              let index = target.items.firstIndex(where: { $0.id == id }) else { return }
        target.items[index].archived = true
        target.items[index].movedToDay = nil
        write(target)
    }

    func restorePlanItem(_ id: String, in dayNumber: Int) {
        guard var target = day(dayNumber),
              let index = target.items.firstIndex(where: { $0.id == id }) else { return }
        target.items[index].archived = false
        target.items[index].movedToDay = nil
        write(target)
    }

    /// Moves an archived stop onto another day, keeping its time.
    func movePlanItem(_ id: String, from dayNumber: Int, toDay newDay: Int) {
        guard var source = day(dayNumber),
              let index = source.items.firstIndex(where: { $0.id == id }),
              var destination = day(newDay) else { return }

        var moved = source.items[index]
        moved.archived = false
        moved.movedToDay = nil
        source.items.remove(at: index)

        var marker = moved
        marker.archived = true
        marker.movedToDay = newDay
        source.items.append(marker)

        destination.items.append(moved)
        destination.items = sortedByTime(destination.items)

        write(source)
        write(destination)
    }

    func updatePlanItemTime(_ id: String, in dayNumber: Int, to time: String) {
        guard var target = day(dayNumber),
              let index = target.items.firstIndex(where: { $0.id == id }) else { return }
        target.items[index].time = time
        write(target)
    }

    func addPlanItem(name: String, time: String, in dayNumber: Int, placeID: String? = nil) {
        guard var target = day(dayNumber) else { return }
        let place = placeID.flatMap { id in places.first { $0.id == id } }
        let item = PlanItem(
            id: "n-\(UUID().uuidString.prefix(8))",
            time: time.isEmpty ? "15:00" : time,
            name: name,
            note: "Added by me",
            kind: .sub,
            placeID: placeID,
            latitude: place?.latitude,
            longitude: place?.longitude
        )
        target.items.append(item)
        target.items = sortedByTime(target.items)
        write(target)
    }

    private func sortedByTime(_ items: [PlanItem]) -> [PlanItem] {
        let active = items.filter { !$0.archived }.sorted {
            (Fmt.minutes(fromClock: $0.time) ?? 0) < (Fmt.minutes(fromClock: $1.time) ?? 0)
        }
        return active + items.filter(\.archived)
    }

    // MARK: Nearby places

    func nearbyPlaces(anchor anchorID: String?, category: PlaceCategory?, sort: NearbySort) -> [Place] {
        let pool = places.filter { anchorID == nil || $0.anchorPlaceID == anchorID }
        let filtered = category == nil ? pool : pool.filter { $0.category == category }
        return filtered.sorted {
            switch sort {
            case .travelTime: return $0.travelMinutes < $1.travelMinutes
            case .stayTime: return $0.stayMinutes < $1.stayMinutes
            }
        }
    }

    func place(_ id: String) -> Place? { places.first { $0.id == id } }

    func addUserPlace(name: String, category: PlaceCategory, walkMinutes: Int, anchor anchorID: String, coordinate: CLLocationCoordinate2D?) {
        let place = Place(
            id: "u-\(UUID().uuidString.prefix(8))",
            anchorPlaceID: anchorID,
            name: name,
            category: category,
            priceTier: "—",
            stayMinutes: 30,
            legs: [TransportLeg(mode: .walk, minutes: max(1, walkMinutes))],
            note: "Added by me",
            isUserAdded: true,
            latitude: coordinate?.latitude,
            longitude: coordinate?.longitude
        )
        places.append(place)
        repo?.save(place, in: TripRepository.Collections.places)
    }

    // MARK: Sub route

    func subRoute(forDay dayNumber: Int) -> SubRoute? {
        subRoutes.first { $0.dayNumber == dayNumber }
    }

    var currentSubRoute: SubRoute? { subRoute(forDay: selectedDay) }

    func schedule(for route: SubRoute) -> SubRouteSchedule {
        var schedule = SubRouteSchedule()
        schedule.startMinutes = route.startMinutes
        var clock = route.startMinutes

        for (index, id) in route.placeIDs.enumerated() {
            guard let place = place(id) else { continue }
            let travel = place.travelMinutes
            clock += travel
            schedule.movingMinutes += travel
            schedule.stops.append(ScheduledStop(index: index + 1, place: place, arrival: clock))
            clock += place.stayMinutes
            schedule.stayMinutes += place.stayMinutes
        }

        schedule.movingMinutes += route.returnMinutes
        schedule.returnClock = clock + route.returnMinutes
        schedule.bufferMinutes = route.deadlineMinutes - schedule.returnClock
        return schedule
    }

    var currentSchedule: SubRouteSchedule? {
        guard let route = currentSubRoute else { return nil }
        return schedule(for: route)
    }

    func isInSubRoute(_ placeID: String) -> Bool {
        currentSubRoute?.placeIDs.contains(placeID) ?? false
    }

    func toggleSubRouteMembership(_ placeID: String) {
        guard var route = currentSubRoute else { return }
        if let index = route.placeIDs.firstIndex(of: placeID) {
            route.placeIDs.remove(at: index)
        } else {
            route.placeIDs.append(placeID)
        }
        write(route)
    }

    func reorderSubRoute(from source: IndexSet, to destination: Int) {
        guard var route = currentSubRoute else { return }
        route.placeIDs.move(fromOffsets: source, toOffset: destination)
        write(route)
    }

    func moveSubRouteStop(_ id: String, onto targetID: String) {
        guard id != targetID, var route = currentSubRoute,
              let from = route.placeIDs.firstIndex(of: id),
              let to = route.placeIDs.firstIndex(of: targetID) else { return }
        let moved = route.placeIDs.remove(at: from)
        route.placeIDs.insert(moved, at: to)
        write(route)
    }

    func setReturnTarget(_ target: ReturnTarget) {
        guard var route = currentSubRoute else { return }
        route.returnTarget = target
        write(route)
    }

    func setReturnMinutes(_ minutes: Int) {
        guard var route = currentSubRoute else { return }
        route.returnMinutes = max(0, minutes)
        write(route)
    }

    /// "Coach · Nishi Market gate", "Next stop · Skyline Deck", and so on.
    func returnLabel(for target: ReturnTarget, route: SubRoute) -> String {
        switch target {
        case .coach: return "Coach · \(route.anchorName) gate"
        case .nextStop:
            let next = nextMainStop(after: route.anchorPlanItemID, in: route.dayNumber)
            return "Next stop · \(next ?? "next destination")"
        case .hotel: return trip?.hotelName ?? "Hotel"
        case .station: return trip?.stationName ?? "Station"
        }
    }

    private func nextMainStop(after itemID: String, in dayNumber: Int) -> String? {
        guard let target = day(dayNumber) else { return nil }
        let active = target.activeItems
        guard let index = active.firstIndex(where: { $0.id == itemID }) else { return nil }
        return active.dropFirst(index + 1).first { $0.kind == .main }?.name
    }

    var subRouteSummaryLine: String {
        guard let schedule = currentSchedule, !schedule.stops.isEmpty else { return "Tap + to add places" }
        return schedule.stops.map(\.place.name).joined(separator: " → ")
    }

    // MARK: Shopping

    var shoppingGroups: [ShoppingGroup] {
        let ordered = shopping.sorted {
            $0.groupOrder == $1.groupOrder ? $0.order < $1.order : $0.groupOrder < $1.groupOrder
        }
        var groups: [ShoppingGroup] = []
        for item in ordered {
            if let index = groups.firstIndex(where: { $0.placeLabel == item.placeLabel }) {
                let existing = groups[index]
                groups[index] = ShoppingGroup(
                    placeLabel: existing.placeLabel,
                    when: existing.when,
                    badge: existing.badge,
                    items: existing.items + [item]
                )
            } else {
                groups.append(ShoppingGroup(
                    placeLabel: item.placeLabel,
                    when: item.placeWhen,
                    badge: item.badge,
                    items: [item]
                ))
            }
        }
        return groups
    }

    var totalSpent: Double { shopping.reduce(0) { $0 + $1.spendAmount } }
    var totalPlanned: Double { shopping.reduce(0) { $0 + ($1.estimate ?? 0) } }
    var boughtCount: Int { shopping.filter(\.bought).count }

    var spendProgress: Double {
        guard totalPlanned > 0 else { return 0 }
        return min(1, totalSpent / totalPlanned)
    }

    var homeCurrencyLabel: String {
        guard let trip, trip.homeCurrencyRate > 0 else { return "—" }
        let converted = totalSpent / trip.homeCurrencyRate
        return Fmt.boundedInt(converted).formatted(.number.grouping(.automatic))
    }

    struct MethodSpend: Identifiable {
        var id: String { method.rawValue }
        let method: PaymentMethod
        let count: Int
        let total: Double
    }

    var spendByMethod: [MethodSpend] {
        PaymentMethod.allCases.map { method in
            let hits = shopping.filter { $0.bought && $0.payment == method }
            return MethodSpend(
                method: method,
                count: hits.count,
                total: hits.reduce(0) { $0 + $1.spendAmount }
            )
        }
    }

    /// Every stop the traveller could buy something at — the dropdown behind
    /// "where" on the add-item form.
    var shoppingPlaceOptions: [String] {
        var options: [String] = []
        if let day {
            options += day.activeItems.filter { !$0.isSubRouteSummary }.map(\.name)
        }
        if let route = currentSubRoute {
            options += route.placeIDs.compactMap { place($0)?.name }
        }
        options.append("Airport, before security")
        var seen = Set<String>()
        return options.filter { seen.insert($0).inserted }
    }

    func toggleBought(_ item: ShoppingItem) {
        var updated = item
        updated.bought.toggle()
        updated.boughtOn = updated.bought ? Date() : nil
        write(updated)
    }

    func setPaid(_ item: ShoppingItem, text: String) {
        var updated = item
        let cleaned = text.filter { $0.isNumber || $0 == "." }
        // Typed input, so keep it inside a range Int(_:) can represent.
        updated.paidAmount = cleaned.isEmpty
            ? nil
            : Double(cleaned).map { min(max($0, 0), 1_000_000_000) }
        write(updated)
    }

    func cyclePayment(_ item: ShoppingItem) {
        var updated = item
        let all = PaymentMethod.allCases
        let index = all.firstIndex(of: item.payment) ?? 0
        updated.payment = all[(index + 1) % all.count]
        write(updated)
    }

    func addShoppingItem(name: String, placeLabel: String, estimate: Double?, payment: PaymentMethod) {
        let label = placeLabel.isEmpty ? "Unplanned · added on the trip" : placeLabel
        let existing = shopping.filter { $0.placeLabel == label }
        let groupOrder = existing.first?.groupOrder ?? ((shopping.map(\.groupOrder).max() ?? 0) + 1)
        let item = ShoppingItem(
            id: "x-\(UUID().uuidString.prefix(8))",
            name: name,
            detail: placeLabel.isEmpty ? "Place to be decided" : "",
            placeLabel: label,
            placeWhen: existing.first?.placeWhen ?? "Added while travelling",
            badge: existing.first?.badge ?? .none,
            groupOrder: groupOrder,
            order: (existing.map(\.order).max() ?? -1) + 1,
            estimate: estimate,
            payment: payment,
            isUnplanned: placeLabel.isEmpty
        )
        shopping.append(item)
        repo?.save(item, in: TripRepository.Collections.shopping)
    }

    // MARK: Must-see

    func shots(forPlace placeID: String) -> [MustSeeShot] {
        mustSee.filter { $0.placeID == placeID }.sorted { $0.order < $1.order }
    }

    func toggleCaptured(_ shot: MustSeeShot) {
        var updated = shot
        updated.captured.toggle()
        write(updated)
    }

    // MARK: Outfit

    func outfitPieces(day dayNumber: Int) -> [String] {
        outfits.first { $0.dayNumber == dayNumber }?.pieces ?? []
    }

    func addOutfitPiece(_ piece: String, day dayNumber: Int) {
        let trimmed = piece.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        var record = outfits.first { $0.dayNumber == dayNumber }
            ?? OutfitRecord(id: "day-\(dayNumber)", dayNumber: dayNumber, pieces: [])
        guard !record.pieces.contains(trimmed) else { return }
        record.pieces.append(trimmed)
        write(record)
    }

    func removeOutfitPiece(_ piece: String, day dayNumber: Int) {
        guard var record = outfits.first(where: { $0.dayNumber == dayNumber }) else { return }
        record.pieces.removeAll { $0 == piece }
        write(record)
    }

    // MARK: Prep

    var prepGroups: [PrepGroup] {
        let categories = trip?.prepCategories ?? []
        var groups: [PrepGroup] = categories.map { title in
            PrepGroup(
                title: title,
                items: prep.filter { $0.category == title }.sorted { $0.order < $1.order }
            )
        }
        // Anything whose category was never registered still gets shown.
        let orphans = prep.filter { !categories.contains($0.category) }
        for orphan in orphans where !groups.contains(where: { $0.title == orphan.category }) {
            groups.append(PrepGroup(
                title: orphan.category,
                items: prep.filter { $0.category == orphan.category }.sorted { $0.order < $1.order }
            ))
        }
        return groups
    }

    var prepPackedCount: Int { prep.filter(\.packed).count }
    var prepTotalCount: Int { prep.count }
    var prepProgress: Double {
        guard prepTotalCount > 0 else { return 0 }
        return Double(prepPackedCount) / Double(prepTotalCount)
    }

    func togglePacked(_ item: PrepItem) {
        var updated = item
        updated.packed.toggle()
        write(updated)
    }

    func cyclePackedLocation(_ item: PrepItem) {
        var updated = item
        let all = PackedLocation.allCases
        let index = all.firstIndex(of: item.location) ?? 0
        updated.location = all[(index + 1) % all.count]
        write(updated)
    }

    func addPrepItem(name: String, category: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        let siblings = prep.filter { $0.category == category }
        let item = PrepItem(
            id: "c-\(UUID().uuidString.prefix(8))",
            category: category,
            categoryOrder: siblings.first?.categoryOrder ?? ((prep.map(\.categoryOrder).max() ?? 0) + 1),
            order: (siblings.map(\.order).max() ?? -1) + 1,
            name: trimmed
        )
        prep.append(item)
        repo?.save(item, in: TripRepository.Collections.prep)
    }

    func addPrepCategory(_ title: String) {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, var trip else { return }
        guard !trip.prepCategories.contains(trimmed) else { return }
        trip.prepCategories.append(trimmed)
        self.trip = trip
        repo?.save(trip)
    }

    // MARK: Log

    var logEntries: [LogEntry] { log }

    func logEntry(day dayNumber: Int) -> LogEntry? {
        log.first { $0.dayNumber == dayNumber }
    }

    func saveNote(dayNumber: Int, destinationPlaceID: String?, destinationLabel: String, text: String) {
        var entry = logEntry(day: dayNumber) ?? LogEntry(
            id: "day-\(dayNumber)",
            dayNumber: dayNumber,
            dayLabel: "Day \(dayNumber)",
            dateLabel: day(dayNumber)?.shortDate ?? ""
        )
        entry.text = text
        entry.destinationPlaceID = destinationPlaceID
        entry.destinationLabel = destinationLabel
        entry.updatedAt = Date()
        entry.chips = entry.chips.filter { $0.label != "note pending" }
        if let spend = spendLabel(forDay: dayNumber), !entry.chips.contains(where: { $0.label == spend }) {
            entry.chips.append(LogChip(label: spend, tone: .neutral))
        }
        write(entry)
    }

    /// Uploads photos for a day's note and records their Storage paths.
    func addPhotos(_ images: [Data], day dayNumber: Int) async {
        guard let uid = repo?.uid, let tripID = repo?.tripID, !images.isEmpty else { return }
        var paths: [String] = []
        for data in images {
            let path = PhotoService.path(uid: uid, tripID: tripID, dayNumber: dayNumber)
            do {
                try await PhotoService.upload(data, to: path)
                paths.append(path)
            } catch {
                continue
            }
        }
        guard !paths.isEmpty else { return }
        var entry = logEntry(day: dayNumber) ?? LogEntry(
            id: "day-\(dayNumber)",
            dayNumber: dayNumber,
            dayLabel: "Day \(dayNumber)",
            dateLabel: day(dayNumber)?.shortDate ?? ""
        )
        entry.photoPaths.append(contentsOf: paths)
        entry.updatedAt = Date()
        write(entry)
    }

    /// The day's spend is totalled from the shopping list — nothing to type in
    /// the composer.
    private func spendLabel(forDay dayNumber: Int) -> String? {
        guard let trip else { return nil }
        let dayStops = Set((day(dayNumber)?.activeItems.map(\.name) ?? []))
        let spend = shopping
            .filter { $0.bought && dayStops.contains($0.placeLabel) }
            .reduce(0) { $0 + $1.spendAmount }
        guard spend > 0 else { return nil }
        return "\(Fmt.money(spend, symbol: trip.currencySymbol)) spent"
    }

    // MARK: Persistence

    private func write(_ value: TripDay) {
        if let index = days.firstIndex(where: { $0.id == value.id }) {
            days[index] = value
        }
        repo?.save(value, in: TripRepository.Collections.days)
    }

    private func write(_ value: SubRoute) {
        if let index = subRoutes.firstIndex(where: { $0.id == value.id }) {
            subRoutes[index] = value
        } else {
            subRoutes.append(value)
        }
        repo?.save(value, in: TripRepository.Collections.subRoutes)
    }

    private func write(_ value: ShoppingItem) {
        if let index = shopping.firstIndex(where: { $0.id == value.id }) {
            shopping[index] = value
        }
        repo?.save(value, in: TripRepository.Collections.shopping)
    }

    private func write(_ value: MustSeeShot) {
        if let index = mustSee.firstIndex(where: { $0.id == value.id }) {
            mustSee[index] = value
        }
        repo?.save(value, in: TripRepository.Collections.mustSee)
    }

    private func write(_ value: PrepItem) {
        if let index = prep.firstIndex(where: { $0.id == value.id }) {
            prep[index] = value
        }
        repo?.save(value, in: TripRepository.Collections.prep)
    }

    private func write(_ value: LogEntry) {
        if let index = log.firstIndex(where: { $0.id == value.id }) {
            log[index] = value
        } else {
            log.append(value)
        }
        repo?.save(value, in: TripRepository.Collections.log)
    }

    private func write(_ value: OutfitRecord) {
        if let index = outfits.firstIndex(where: { $0.id == value.id }) {
            outfits[index] = value
        } else {
            outfits.append(value)
        }
        repo?.save(value, in: TripRepository.Collections.outfits)
    }
}
