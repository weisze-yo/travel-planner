import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

/// Firestore layout, all under the signed-in uid:
///
///     users/{uid}/trips/{tripID}                 → Trip
///     users/{uid}/trips/{tripID}/days/{dayID}    → TripDay (plan items nested)
///     users/{uid}/trips/{tripID}/places/{id}     → Place (nearby pool + user's own)
///     users/{uid}/trips/{tripID}/subRoutes/{id}  → SubRoute, one per day
///     users/{uid}/trips/{tripID}/shopping/{id}   → ShoppingItem
///     users/{uid}/trips/{tripID}/mustSee/{id}    → MustSeeShot
///     users/{uid}/trips/{tripID}/prep/{id}       → PrepItem
///     users/{uid}/trips/{tripID}/log/{id}        → LogEntry
///     users/{uid}/trips/{tripID}/outfits/{id}    → OutfitRecord
///
/// Lists that change one row at a time get their own collection so two devices
/// editing different rows never overwrite each other; the day's itinerary lives
/// in one document per day because reordering rewrites the whole sequence.
final class TripRepository {

    enum Collections {
        static let days = "days"
        static let places = "places"
        static let subRoutes = "subRoutes"
        static let shopping = "shopping"
        static let mustSee = "mustSee"
        static let prep = "prep"
        static let log = "log"
        static let outfits = "outfits"
    }

    let uid: String
    let tripID: String

    private let db: Firestore
    private var listeners: [ListenerRegistration] = []

    init(uid: String, tripID: String = SeedData.tripID, db: Firestore = Firestore.firestore()) {
        self.uid = uid
        self.tripID = tripID
        self.db = db
    }

    deinit {
        listeners.forEach { $0.remove() }
    }

    // MARK: References

    private var tripRef: DocumentReference {
        db.collection("users").document(uid).collection("trips").document(tripID)
    }

    private func col(_ name: String) -> CollectionReference {
        tripRef.collection(name)
    }

    // MARK: Seeding

    /// Writes the demo trip the first time this account opens the app. A real
    /// import (paste / photo / PDF of an agent itinerary) would replace this.
    func seedIfNeeded() async throws {
        let existing = try await tripRef.getDocument()
        guard !existing.exists else { return }

        let batch = db.batch()
        try batch.setData(from: SeedData.trip, forDocument: tripRef)
        for day in SeedData.days {
            try batch.setData(from: day, forDocument: col(Collections.days).document(day.id))
        }
        for place in SeedData.places {
            try batch.setData(from: place, forDocument: col(Collections.places).document(place.id))
        }
        let sub = SeedData.subRoute
        try batch.setData(from: sub, forDocument: col(Collections.subRoutes).document(sub.id))
        for item in SeedData.shopping {
            try batch.setData(from: item, forDocument: col(Collections.shopping).document(item.id))
        }
        for shot in SeedData.mustSee {
            try batch.setData(from: shot, forDocument: col(Collections.mustSee).document(shot.id))
        }
        for item in SeedData.prep {
            try batch.setData(from: item, forDocument: col(Collections.prep).document(item.id))
        }
        for entry in SeedData.log {
            try batch.setData(from: entry, forDocument: col(Collections.log).document(entry.id))
        }
        try await batch.commit()
    }

    // MARK: Observation

    func observeTrip(_ onChange: @MainActor @escaping (Trip) -> Void) {
        let registration = tripRef.addSnapshotListener { snapshot, _ in
            guard let snapshot, snapshot.exists,
                  let trip = try? snapshot.data(as: Trip.self) else { return }
            Self.onMain { onChange(trip) }
        }
        listeners.append(registration)
    }

    func observe<T: Decodable & Sendable>(_ collection: String, as type: T.Type, onChange: @MainActor @escaping ([T]) -> Void) {
        let registration = col(collection).addSnapshotListener { snapshot, _ in
            guard let snapshot else { return }
            let values = snapshot.documents.compactMap { try? $0.data(as: T.self) }
            Self.onMain { onChange(values) }
        }
        listeners.append(registration)
    }

    /// Firestore delivers snapshots on the main queue, so the common path stays
    /// synchronous and in order; the hop is only a safety net.
    private static func onMain(_ work: @MainActor @escaping () -> Void) {
        if Thread.isMainThread {
            MainActor.assumeIsolated { work() }
        } else {
            Task { @MainActor in work() }
        }
    }

    func stopObserving() {
        listeners.forEach { $0.remove() }
        listeners.removeAll()
    }

    // MARK: Writes

    func save(_ trip: Trip) {
        try? tripRef.setData(from: trip, merge: true)
    }

    func save<T: Encodable & Identifiable>(_ value: T, in collection: String) where T.ID == String {
        try? col(collection).document(value.id).setData(from: value)
    }

    func delete(id: String, in collection: String) {
        col(collection).document(id).delete()
    }
}
