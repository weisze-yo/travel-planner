import Foundation
import CoreLocation

// MARK: - Places

enum PlaceCategory: String, Codable, CaseIterable, Hashable {
    case food, cosme, cloth, shopping, sight, rest

    var label: String {
        switch self {
        case .food: return "Food"
        case .cosme: return "Cosmetic & health"
        case .cloth: return "Clothing"
        case .shopping: return "Shopping"
        case .sight: return "Sights"
        case .rest: return "Rest"
        }
    }
}

enum TransportMode: String, Codable, Hashable {
    case walk, train, bus

    var icon: String {
        switch self {
        case .walk: return "🚶"
        case .train: return "🚆"
        case .bus: return "🚌"
        }
    }

    var label: String {
        switch self {
        case .walk: return "walk"
        case .train: return "train"
        case .bus: return "bus"
        }
    }
}

struct TransportLeg: Codable, Hashable {
    var mode: TransportMode
    var minutes: Int
}

/// A candidate the traveller can walk to from a main-route stop, plus anything
/// they added themselves. `anchorPlaceID` is the main-route stop it hangs off.
struct Place: Identifiable, Codable, Hashable {
    var id: String
    var anchorPlaceID: String
    var name: String
    var category: PlaceCategory
    var priceTier: String
    var stayMinutes: Int
    var legs: [TransportLeg]
    var note: String
    var isUserAdded: Bool = false
    var latitude: Double?
    var longitude: Double?

    /// Door-to-door minutes across every leg of the journey.
    var travelMinutes: Int { legs.reduce(0) { $0 + $1.minutes } }

    var coordinate: CLLocationCoordinate2D? {
        guard let latitude, let longitude else { return nil }
        return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

/// One row of the need-to-know table on a destination.
struct EssentialRow: Codable, Hashable {
    var key: String
    var value: String
    var detail: String
}

// MARK: - Itinerary

enum PlanItemKind: String, Codable, Hashable {
    /// Fixed by the travel agent — readable, reorderable only in edit mode.
    case main
    /// Anything the traveller added themselves.
    case sub
}

struct PlanItem: Identifiable, Codable, Hashable {
    var id: String
    /// Kept as text because an agent itinerary arrives as text and the
    /// traveller edits it the same way.
    var time: String
    var durationLabel: String = ""
    var name: String
    var subtitle: String = ""
    var note: String = ""
    /// Long-form description shown on the destination screen.
    var summary: String = ""
    /// e.g. "13:30 – 15:45"
    var windowLabel: String = ""
    var chips: [String] = []
    var kind: PlanItemKind = .main
    /// The "My sub route · 3 stops" row, which opens the sub route rather than
    /// a destination.
    var isSubRouteSummary: Bool = false
    var placeID: String?
    var essentials: [EssentialRow] = []
    var latitude: Double?
    var longitude: Double?
    /// Removed stops fall into the archive at the bottom of edit mode.
    var archived: Bool = false
    var movedToDay: Int?

    var coordinate: CLLocationCoordinate2D? {
        guard let latitude, let longitude else { return nil }
        return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

struct DayWeather: Codable, Hashable {
    var dayNumber: Int
    var icon: String
    var high: Int
    var low: Int
    var rainChance: Int
    var summary: String

    var rainLabel: String { "\(rainChance)%" }
    var shortLine: String { "\(high) °C, \(summary)" }
}

struct TripDay: Identifiable, Codable, Hashable {
    var id: String
    var dayNumber: Int
    var dateLabel: String
    var shortDate: String
    /// First area to last area of the day, e.g. "Old Quarter to Skyline".
    var areaSpan: String
    var items: [PlanItem]

    var activeItems: [PlanItem] { items.filter { !$0.archived } }
    var archivedItems: [PlanItem] { items.filter { $0.archived } }
}

// MARK: - Sub route

enum ReturnTarget: String, Codable, CaseIterable, Hashable {
    case coach, nextStop, hotel, station
}

/// The traveller's own loop off one main-route stop, time-checked against the
/// coach departure.
struct SubRoute: Identifiable, Codable, Hashable {
    var id: String
    var dayNumber: Int
    var anchorPlanItemID: String
    var anchorName: String
    /// Minutes past midnight the loop starts.
    var startMinutes: Int
    /// Minutes past midnight the traveller must be back.
    var deadlineMinutes: Int
    var placeIDs: [String]
    var returnTarget: ReturnTarget = .coach
    var returnMinutes: Int = 8
}

// MARK: - Shopping

enum PaymentMethod: String, Codable, CaseIterable, Hashable {
    case cash, card, ic, ewallet

    var label: String {
        switch self {
        case .cash: return "Cash"
        case .card: return "Card"
        case .ic: return "IC card"
        case .ewallet: return "E-wallet"
        }
    }
}

enum ShoppingBadge: String, Codable, Hashable {
    case none, ifTime, lastChance

    var label: String? {
        switch self {
        case .none: return nil
        case .ifTime: return "IF TIME"
        case .lastChance: return "LAST CHANCE"
        }
    }
}

struct ShoppingItem: Identifiable, Codable, Hashable {
    var id: String
    var name: String
    var detail: String = ""
    /// Group key — a main-route or sub-route stop, or the airport.
    var placeLabel: String
    var placeWhen: String = ""
    var badge: ShoppingBadge = .none
    var groupOrder: Int = 0
    var order: Int = 0
    /// Optional up front; the real price is entered after ticking.
    var estimate: Double?
    var paidAmount: Double?
    var payment: PaymentMethod = .cash
    var bought: Bool = false
    /// Stamped when ticked, cleared when unticked.
    var boughtOn: Date?
    var isUnplanned: Bool = false

    /// Only ticked items count towards spend; a ticked item with no real price
    /// falls back to its estimate.
    var spendAmount: Double {
        guard bought else { return 0 }
        return paidAmount ?? estimate ?? 0
    }
}

// MARK: - Must-see

struct MustSeeShot: Identifiable, Codable, Hashable {
    var id: String
    var placeID: String
    var title: String
    var tag: String
    var summary: String
    var whereToFind: String
    /// Firebase Storage path, once the traveller or a place API supplies one.
    var imagePath: String?
    var captured: Bool = false
    var order: Int = 0
    var latitude: Double?
    var longitude: Double?

    var coordinate: CLLocationCoordinate2D? {
        guard let latitude, let longitude else { return nil }
        return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

/// What the traveller is actually bringing for a day, kept separate from the
/// weather-driven suggestion.
struct OutfitRecord: Identifiable, Codable, Hashable {
    var id: String
    var dayNumber: Int
    var pieces: [String]
}

// MARK: - Prep

enum PackedLocation: String, Codable, CaseIterable, Hashable {
    case notPacked, suitcase, carryOn, backpack

    var label: String {
        switch self {
        case .notPacked: return "Not packed"
        case .suitcase: return "Suitcase"
        case .carryOn: return "Carry-on"
        case .backpack: return "Backpack"
        }
    }
}

struct PrepItem: Identifiable, Codable, Hashable {
    var id: String
    var category: String
    var categoryOrder: Int = 0
    var order: Int = 0
    var name: String
    /// Why the line exists — "Day 4: 80% rain" — so the list is auditable.
    var why: String = ""
    var packed: Bool = false
    var location: PackedLocation = .notPacked
}

// MARK: - Log

enum ChipTone: String, Codable, Hashable {
    case jade, amber, neutral
}

struct LogChip: Codable, Hashable {
    var label: String
    var tone: ChipTone
}

struct LogEntry: Identifiable, Codable, Hashable {
    var id: String
    var dayNumber: Int
    var dayLabel: String
    var dateLabel: String
    var meta: String = ""
    var metaIsLive: Bool = false
    var destinationLabel: String = ""
    var destinationPlaceID: String?
    var text: String = ""
    /// Cloud Storage paths for photos attached to this day.
    var photoPaths: [String] = []
    /// Photos taken on the day that live in the camera roll rather than here —
    /// the seeded demo day uses this to show a count without uploads.
    var photoCount: Int = 0
    var chips: [LogChip] = []
    var updatedAt: Date = Date()
}

// MARK: - Trip

struct Trip: Identifiable, Codable, Hashable {
    var id: String
    var name: String
    var code: String
    var dateRange: String
    var dayCount: Int
    var currentDay: Int
    var departsInDays: Int
    /// Real calendar date of day 1, used to fetch a genuine forecast.
    var startDate: Date?
    var currencySymbol: String = "¥"
    var homeCurrencyCode: String = "RM"
    /// Units of `currencySymbol` per unit of `homeCurrencyCode`.
    var homeCurrencyRate: Double = 33.7
    var hotelName: String = ""
    var stationName: String = ""
    /// Ordered packing categories, including ones the traveller adds while a
    /// category is still empty.
    var prepCategories: [String] = []
    var weather: [DayWeather] = []
    var latitude: Double = 35.6895
    var longitude: Double = 139.6917
    var weatherUpdatedAt: Date?

    func weather(forDay day: Int) -> DayWeather? {
        weather.first { $0.dayNumber == day }
    }

    func date(forDay day: Int) -> Date? {
        guard let startDate else { return nil }
        return Calendar.current.date(byAdding: .day, value: day - 1, to: startDate)
    }

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

// MARK: - Formatting helpers

enum Fmt {
    static func clock(_ minutes: Int) -> String {
        String(format: "%02d:%02d", minutes / 60, minutes % 60)
    }

    static func duration(_ minutes: Int) -> String {
        guard minutes >= 60 else { return "\(minutes) min" }
        let h = minutes / 60
        let m = minutes % 60
        return m == 0 ? "\(h)h" : "\(h)h \(m)m"
    }

    static func money(_ amount: Double, symbol: String = "¥") -> String {
        return symbol + boundedInt(amount).formatted(.number.grouping(.automatic))
    }

    /// Prices are typed by hand, so never hand `Int(_:)` something it cannot
    /// represent.
    static func boundedInt(_ value: Double) -> Int {
        guard value.isFinite else { return 0 }
        return Int(min(max(value, -1e15), 1e15).rounded())
    }

    static func minutes(fromClock text: String) -> Int? {
        let parts = text.split(separator: ":")
        guard parts.count == 2, let h = Int(parts[0]), let m = Int(parts[1]) else { return nil }
        return h * 60 + m
    }

    static let stampFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        return f
    }()

    static func stamp(_ date: Date) -> String { stampFormatter.string(from: date) }
}
