import SwiftUI
import MapKit

/// Screen 2d — every place around the stop, no time gate. Sort by travel or
/// stay time, filter by category, and see multi-leg journeys spelled out.
struct NearbyView: View {
    @EnvironmentObject private var store: TripStore
    @Environment(\.dismiss) private var dismiss

    let anchorPlaceID: String

    @State private var sort: NearbySort = .travelTime
    @State private var category: PlaceCategory?
    @State private var sortOpen = false

    @State private var addOpen = false
    @State private var newName = ""
    @State private var newCategory: PlaceCategory = .food
    @State private var newWalk = ""
    @State private var isSearching = false

    var body: some View {
        VStack(spacing: 0) {
            header
            list
        }
        .background(Palette.bone)
        .toolbar(.hidden, for: .navigationBar)
        .overlay(alignment: .bottom) {
            if let route = store.currentSubRoute {
                subRouteBar(route)
            }
        }
    }

    private var places: [Place] {
        store.nearbyPlaces(anchor: anchorPlaceID, category: category, sort: sort)
    }

    private var anchorName: String {
        store.place(anchorPlaceID)?.name
            ?? store.planItem(anchorPlaceID)?.name
            ?? store.day(store.selectedDay)?.activeItems.first { $0.placeID == anchorPlaceID }?.name
            ?? "this stop"
    }

    // MARK: Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Palette.ink)
                        .frame(width: 32, height: 32)
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 1) {
                    Text("Around \(anchorName)")
                        .font(Typo.pushTitle())
                    if let route = store.currentSubRoute {
                        Text("Coach leaves \(Fmt.clock(route.deadlineMinutes)) · be back 5 min early")
                            .font(Typo.meta())
                            .foregroundStyle(Palette.muted)
                    }
                }
                Spacer(minLength: 0)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 5) {
                    categoryChip(nil, label: "All")
                    ForEach(PlaceCategory.allCases, id: \.self) { item in
                        categoryChip(item, label: item.label)
                    }
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .background(Color.white)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Palette.border).frame(height: 1)
        }
    }

    private func categoryChip(_ value: PlaceCategory?, label: String) -> some View {
        let isOn = category == value
        return Button {
            category = value
        } label: {
            Text(label)
                .font(.system(size: 11.5, weight: .semibold))
                .foregroundStyle(isOn ? Palette.jade : Palette.muted)
                .padding(.horizontal, 10)
                .frame(height: 30)
                .background(isOn ? Palette.jadeSoft : Palette.bone,
                            in: RoundedRectangle(cornerRadius: 9, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    // MARK: List

    private var list: some View {
        ScrollView {
            VStack(spacing: 9) {
                countLine

                if sortOpen {
                    sortSheet
                }

                ForEach(places) { place in
                    NearbyCard(
                        place: place,
                        isInRoute: store.isInSubRoute(place.id),
                        onToggle: { store.toggleSubRouteMembership(place.id) }
                    )
                }

                if addOpen {
                    addPlaceForm
                }

                DashedAddButton(title: "+ Add a place myself", height: 46) {
                    addOpen.toggle()
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 210)
        }
    }

    private var countLine: some View {
        HStack(spacing: 8) {
            Text("\(places.count) places · sorted by \(sort.label.lowercased())")
                .font(.system(size: 11.5, weight: .bold))
                .foregroundStyle(Palette.muted)
            Spacer(minLength: 0)
            Button {
                sortOpen.toggle()
            } label: {
                Image(systemName: "line.3.horizontal.decrease")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(sortOpen ? .white : Palette.charcoal)
                    .frame(width: 32, height: 32)
                    .background(sortOpen ? Palette.ink : Color.white,
                                in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
            .buttonStyle(.plain)
        }
    }

    private var sortSheet: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("SORT BY")
                .sectionLabelStyle()
                .padding(.horizontal, 8)
                .padding(.top, 6)
                .padding(.bottom, 4)
            ForEach(NearbySort.allCases, id: \.self) { option in
                Button {
                    sort = option
                    sortOpen = false
                } label: {
                    HStack(spacing: 9) {
                        RadioDot(isOn: sort == option)
                        Text(option.label)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(sort == option ? Palette.ink : Palette.muted)
                        Spacer(minLength: 0)
                    }
                    .padding(10)
                    .background(sort == option ? Palette.bone : .clear,
                                in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(6)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(Palette.field, lineWidth: 1)
        }
        .shadow(color: Color.black.opacity(0.08), radius: 10, y: 4)
    }

    // MARK: Add a place

    private var addPlaceForm: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Add a place")
                .font(.system(size: 12.5, weight: .heavy))

            TextField("Place name", text: $newName)
                .textFieldStyle(.plain)
                .font(.system(size: 13))
                .padding(.horizontal, 10)
                .frame(height: 38)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .strokeBorder(Palette.field, lineWidth: 1)
                }

            HStack(spacing: 8) {
                Picker("Category", selection: $newCategory) {
                    ForEach(PlaceCategory.allCases, id: \.self) { item in
                        Text(item.label).tag(item)
                    }
                }
                .pickerStyle(.menu)
                .tint(Palette.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 10)
                .frame(height: 38)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .strokeBorder(Palette.field, lineWidth: 1)
                }

                TextField("Walk min", text: $newWalk)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13))
                    .keyboardType(.numberPad)
                    .padding(.horizontal, 10)
                    .frame(width: 104, height: 38)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .strokeBorder(Palette.field, lineWidth: 1)
                    }
            }

            HStack(spacing: 8) {
                Button {
                    Task { await savePlace() }
                } label: {
                    HStack(spacing: 6) {
                        if isSearching { ProgressView().tint(.white).controlSize(.small) }
                        Text(isSearching ? "Looking up…" : "Save")
                    }
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 40)
                    .background(Palette.jade, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(newName.trimmingCharacters(in: .whitespaces).isEmpty || isSearching)

                Button {
                    addOpen = false
                    newName = ""
                    newWalk = ""
                } label: {
                    Text("Cancel")
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundStyle(Palette.charcoal)
                        .frame(width: 88, height: 40)
                        .background(Palette.bone, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            Text("We look the name up on the map to pin it and to hand it to Google or Apple Maps later.")
                .font(.system(size: 11))
                .foregroundStyle(Palette.soft)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(13)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 15, style: .continuous)
                .strokeBorder(Palette.ink, lineWidth: 1.5)
        }
    }

    private func savePlace() async {
        let name = newName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        isSearching = true
        let anchorCoordinate = store.place(anchorPlaceID)?.coordinate
            ?? store.day(store.selectedDay)?.activeItems.first { $0.placeID == anchorPlaceID }?.coordinate
            ?? store.trip?.coordinate
        let found = await PlaceSearch.firstMatch(for: name, near: anchorCoordinate)
        store.addUserPlace(
            name: name,
            category: newCategory,
            walkMinutes: Int(newWalk) ?? 5,
            anchor: anchorPlaceID,
            coordinate: found
        )
        isSearching = false
        addOpen = false
        newName = ""
        newWalk = ""
    }

    // MARK: Sub route bar

    private func subRouteBar(_ route: SubRoute) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("MY SUB ROUTE · \(route.placeIDs.count) STOPS")
                    .font(.system(size: 10.5, weight: .heavy))
                    .tracking(0.6)
                    .foregroundStyle(Palette.onDarkLabel)
                Text(store.subRouteSummaryLine)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
            }
            Spacer(minLength: 0)
            NavigationLink(value: Route.subRoute) {
                Text("Arrange")
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .frame(height: 38)
                    .background(Palette.amber, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .background(Palette.ink, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .shadow(color: Color.black.opacity(0.28), radius: 14, y: 8)
        .padding(.horizontal, 12)
        .padding(.bottom, 92)
    }
}

// MARK: - Card

private struct NearbyCard: View {
    let place: Place
    let isInRoute: Bool
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 11) {
            NavigationLink(value: Route.placeDetail(placeID: place.id)) {
                PhotoPlaceholder(label: nil)
                    .frame(width: 56, height: 56)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(place.name)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Palette.ink)
                    Spacer(minLength: 0)
                    Text(place.priceTier)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(Palette.soft)
                }
                Text("\(place.category.label) · \(place.note)")
                    .font(.system(size: 11))
                    .foregroundStyle(Palette.muted)
                    .lineLimit(1)
                    .padding(.top, 2)

                // Multi-leg journeys are spelled out, not collapsed to a number.
                HStack(spacing: 5) {
                    ForEach(Array(place.legs.enumerated()), id: \.offset) { _, leg in
                        Chip(label: "\(leg.mode.icon) \(leg.mode.label) \(leg.minutes)",
                             background: Palette.hairline, foreground: Palette.charcoal)
                    }
                    Chip(label: Fmt.duration(place.travelMinutes), background: Palette.ink, foreground: .white)
                    Chip(label: "stay ~\(Fmt.duration(place.stayMinutes))",
                         background: Palette.amberSoft, foreground: Palette.amberInk)
                }
                .padding(.top, 7)
            }

            Button(action: onToggle) {
                Image(systemName: isInRoute ? "checkmark" : "plus")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(isInRoute ? .white : Palette.charcoal)
                    .frame(width: 34, height: 34)
                    .background(isInRoute ? Palette.amber : Palette.bone,
                                in: RoundedRectangle(cornerRadius: 11, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .padding(11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 15, style: .continuous)
                .strokeBorder(isInRoute ? Palette.amberSoftBorder : Palette.rule, lineWidth: 1)
        }
    }
}

// MARK: - Geocoding

enum PlaceSearch {
    /// Looks a typed name up near the stop so a hand-added place still gets a
    /// pin and a working maps hand-off.
    static func firstMatch(for query: String, near coordinate: CLLocationCoordinate2D?) async -> CLLocationCoordinate2D? {
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = query
        if let coordinate {
            request.region = MKCoordinateRegion(
                center: coordinate,
                span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
            )
        }
        do {
            let response = try await MKLocalSearch(request: request).start()
            return response.mapItems.first?.placemark.coordinate
        } catch {
            return nil
        }
    }
}
