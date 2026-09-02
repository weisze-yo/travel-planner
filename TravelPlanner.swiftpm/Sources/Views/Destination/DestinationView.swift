import SwiftUI
import CoreLocation

/// Screen 2c — everything hangs off a place: what you need to know, what is
/// around it, the shots worth getting, what you meant to buy there, and the
/// note you write afterwards.
struct DestinationView: View {
    enum Target: Hashable {
        case planItem(String)
        case place(String)
    }

    @EnvironmentObject private var store: TripStore
    @EnvironmentObject private var router: AppRouter
    @Environment(\.dismiss) private var dismiss

    let target: Target

    init(planItemID: String) { self.target = .planItem(planItemID) }
    init(placeID: String) { self.target = .place(placeID) }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                hero
                identity
                details
            }
        }
        .background(Palette.bone)
        .ignoresSafeArea(edges: .top)
        .toolbar(.hidden, for: .navigationBar)
    }

    // MARK: Resolved subject

    private var planItem: PlanItem? {
        guard case let .planItem(id) = target else { return nil }
        return store.planItem(id)
    }

    private var place: Place? {
        switch target {
        case .place(let id): return store.place(id)
        case .planItem: return planItem?.placeID.flatMap { store.place($0) }
        }
    }

    private var title: String { planItem?.name ?? place?.name ?? "Place" }

    private var subtitle: String {
        if let planItem, !planItem.subtitle.isEmpty { return planItem.subtitle }
        if let place { return "\(place.category.label) · \(place.priceTier)" }
        return ""
    }

    private var summary: String {
        if let planItem, !planItem.summary.isEmpty { return planItem.summary }
        return place?.note ?? ""
    }

    private var coordinate: CLLocationCoordinate2D? {
        planItem?.coordinate ?? place?.coordinate
    }

    /// Which stop the nearby pool belongs to. A sub-route place borrows its
    /// anchor's pool, since that is the stop with the slack.
    private var anchorPlaceID: String? {
        if case let .place(id) = target { return store.place(id)?.anchorPlaceID }
        return planItem?.placeID
    }

    private var stopNumber: Int? {
        guard let planItem, let day = store.day(store.selectedDay) else { return nil }
        return store.mainStopNumbers(for: day)[planItem.id]
    }

    // MARK: Hero

    private var hero: some View {
        PhotoPlaceholder(label: nil, radius: 0)
            .frame(height: 230)
            .overlay(alignment: .topLeading) {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Palette.ink)
                        .frame(width: 40, height: 40)
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                }
                .buttonStyle(.plain)
                .padding(.leading, 14)
                .padding(.top, 56)
            }
            .overlay(alignment: .topTrailing) {
                Text("Photo placeholder")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 5)
                    .background(Palette.ink.opacity(0.6), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .padding(.trailing, 14)
                    .padding(.top, 64)
            }
            .overlay(alignment: .bottomLeading) {
                HStack(spacing: 6) {
                    if let planItem {
                        if planItem.kind == .main, let stopNumber {
                            Chip(label: "MAIN ROUTE · STOP \(stopNumber)",
                                 background: Palette.jade, foreground: .white, size: 10, weight: .heavy)
                        } else {
                            Chip(label: "SUB ROUTE", background: Palette.amber, foreground: .white, size: 10, weight: .heavy)
                        }
                        if !planItem.windowLabel.isEmpty {
                            Chip(label: planItem.windowLabel, background: .white, foreground: Palette.ink, size: 10, weight: .heavy)
                        }
                    } else if let place {
                        Chip(label: "SUB ROUTE CANDIDATE", background: Palette.amber, foreground: .white, size: 10, weight: .heavy)
                        Chip(label: "stay ~\(Fmt.duration(place.stayMinutes))",
                             background: .white, foreground: Palette.ink, size: 10, weight: .heavy)
                    }
                }
                .padding(16)
            }
    }

    // MARK: Identity block

    private var identity: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(title)
                .font(Typo.screenTitle())
            if !subtitle.isEmpty {
                Text(subtitle)
                    .font(.system(size: 12.5))
                    .foregroundStyle(Palette.muted)
                    .padding(.top, 4)
            }
            if !summary.isEmpty {
                Text(summary)
                    .font(.system(size: 13.5))
                    .lineSpacing(3)
                    .foregroundStyle(Palette.charcoal)
                    .padding(.top, 12)
            }

            if let place, planItem == nil {
                HStack(spacing: 5) {
                    ForEach(Array(place.legs.enumerated()), id: \.offset) { _, leg in
                        Chip(label: "\(leg.mode.icon) \(leg.mode.label) \(leg.minutes)",
                             background: Palette.hairline, foreground: Palette.charcoal)
                    }
                    Chip(label: Fmt.duration(place.travelMinutes), background: Palette.ink, foreground: .white)
                }
                .padding(.top, 12)
            }

            MapHandoffButtons(name: title, coordinate: coordinate)
                .padding(.top, 14)

            tabRow
                .padding(.top, 18)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .background(Color.white)
    }

    private var tabRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                destinationTab("Info", isActive: true) {}
                if let anchorPlaceID {
                    destinationTabLink("Nearby", route: .nearby(anchorPlaceID: anchorPlaceID))
                }
                if let placeID = planItem?.placeID ?? place?.id, !store.shots(forPlace: placeID).isEmpty {
                    destinationTabLink("Must-see", route: .mustSee(placeID: placeID))
                }
                destinationTab("Shop", isActive: false) { router.tab = .shop }
                destinationTabLink("Log", route: .note(dayNumber: store.selectedDay, placeID: planItem?.placeID ?? place?.id))
            }
        }
        .overlay(alignment: .bottom) {
            Rectangle().fill(Palette.border).frame(height: 1)
        }
    }

    private func destinationTab(_ label: String, isActive: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            destinationTabLabel(label, isActive: isActive)
        }
        .buttonStyle(.plain)
    }

    private func destinationTabLink(_ label: String, route: Route) -> some View {
        NavigationLink(value: route) {
            destinationTabLabel(label, isActive: false)
        }
        .buttonStyle(.plain)
    }

    private func destinationTabLabel(_ label: String, isActive: Bool) -> some View {
        Text(label)
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(isActive ? Palette.ink : Palette.muted)
            .padding(.bottom, 10)
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(isActive ? Palette.ink : .clear)
                    .frame(height: 2)
            }
    }

    // MARK: Details

    private var details: some View {
        VStack(spacing: 12) {
            if let rows = planItem?.essentials, !rows.isEmpty {
                VStack(spacing: 0) {
                    ForEach(Array(rows.enumerated()), id: \.offset) { index, row in
                        if index > 0 {
                            Rectangle().fill(Palette.hairline).frame(height: 1)
                        }
                        HStack(alignment: .top, spacing: 12) {
                            Text(row.key.uppercased())
                                .font(.system(size: 11, weight: .bold))
                                .tracking(0.4)
                                .foregroundStyle(Palette.soft)
                                .frame(width: 80, alignment: .leading)
                                .padding(.top, 2)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(row.value)
                                    .font(.system(size: 13.5, weight: .medium))
                                Text(row.detail)
                                    .font(Typo.meta())
                                    .foregroundStyle(Palette.muted)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                    }
                }
                .cardSurface()
            }

            doorways

            shopHereRow

            addNoteRow
        }
        .padding(.horizontal, 16)
        .padding(.top, 14)
        .padding(.bottom, 120)
    }

    private var doorways: some View {
        HStack(spacing: 10) {
            if let anchorPlaceID {
                NavigationLink(value: Route.nearby(anchorPlaceID: anchorPlaceID)) {
                    doorwayCard(
                        label: "NEARBY",
                        value: "\(store.nearbyPlaces(anchor: anchorPlaceID, category: nil, sort: .travelTime).count) places",
                        detail: "Sorted by travel time",
                        background: Palette.amberSoft,
                        border: Palette.amberSoftBorder,
                        accent: Palette.amberInk
                    )
                }
                .buttonStyle(.plain)
            }

            if let placeID = planItem?.placeID ?? place?.id {
                let shots = store.shots(forPlace: placeID)
                if !shots.isEmpty {
                    NavigationLink(value: Route.mustSee(placeID: placeID)) {
                        doorwayCard(
                            label: "MUST-SEE",
                            value: "\(shots.count) spots",
                            detail: "Known shots at this stop",
                            background: Palette.jadeSoft,
                            border: Palette.jadeSoftBorder,
                            accent: Palette.jade
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func doorwayCard(label: String, value: String, detail: String,
                             background: Color, border: Color, accent: Color) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label)
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.5)
                .foregroundStyle(accent)
            Text(value)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(Palette.ink)
            Text(detail)
                .font(.system(size: 11))
                .foregroundStyle(accent)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(13)
        .background(background, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(border, lineWidth: 1)
        }
    }

    private var itemsHere: [ShoppingItem] {
        store.shopping.filter { $0.placeLabel == title }
    }

    private var shopHereRow: some View {
        Button {
            router.tab = .shop
        } label: {
            rowCard(
                glyph: "bag",
                title: itemsHere.isEmpty ? "Nothing on your list here" : "\(itemsHere.count) items on your list here",
                detail: itemsHere.isEmpty
                    ? "Add something you want to buy at this stop"
                    : itemsHere.map(\.name).joined(separator: ", ")
            )
        }
        .buttonStyle(.plain)
    }

    private var addNoteRow: some View {
        NavigationLink(value: Route.note(dayNumber: store.selectedDay, placeID: planItem?.placeID ?? place?.id)) {
            rowCard(
                glyph: "square.and.pencil",
                title: "Add a note",
                detail: "Log what happened at this stop"
            )
        }
        .buttonStyle(.plain)
    }

    private func rowCard(glyph: String, title: String, detail: String) -> some View {
        HStack(spacing: 11) {
            Image(systemName: glyph)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Palette.charcoal)
                .frame(width: 34, height: 34)
                .background(Palette.bone, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(Typo.rowTitle())
                    .foregroundStyle(Palette.ink)
                Text(detail)
                    .font(Typo.meta())
                    .foregroundStyle(Palette.muted)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Palette.soft)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardSurface(radius: 14)
    }
}
