import SwiftUI
import MapKit

/// Screen 2a — the map is home, with today's itinerary riding on it as a sheet.
/// Agent route: solid jade, numbered. Anything the traveller planned: dashed
/// amber. Every pin opens the place it belongs to.
struct MapHomeView: View {
    @EnvironmentObject private var store: TripStore
    @EnvironmentObject private var router: AppRouter

    @State private var camera: MapCameraPosition = .automatic
    @State private var languageNotice = false

    var body: some View {
        ZStack(alignment: .top) {
            mapLayer
                .ignoresSafeArea()

            VStack(spacing: 10) {
                header
                DayPillRow(days: store.days, weather: { store.weather($0) }, selected: $store.selectedDay)
                legend
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
            .padding(.horizontal, 16)
        }
        .overlay(alignment: .bottom) {
            todaySheet
        }
        .overlay(alignment: .bottomTrailing) {
            editButton
                .padding(.trailing, 16)
                .padding(.bottom, sheetHeight + 88)
        }
        .background(Palette.bone)
        .toolbar(.hidden, for: .navigationBar)
        .onAppear(perform: focusOnDay)
        .onChange(of: store.selectedDay) { _, _ in focusOnDay() }
    }

    // MARK: Map

    private var mapLayer: some View {
        Map(position: $camera, interactionModes: .all) {
            if mainCoordinates.count > 1 {
                MapPolyline(coordinates: mainCoordinates)
                    .stroke(Palette.jade, style: StrokeStyle(lineWidth: 5.5, lineCap: .round, lineJoin: .round))
            }
            if subLoopCoordinates.count > 1 {
                MapPolyline(coordinates: subLoopCoordinates)
                    .stroke(Palette.amber, style: StrokeStyle(lineWidth: 3, lineCap: .round, dash: [3, 7]))
            }
            ForEach(pins) { pin in
                Annotation(pin.name, coordinate: pin.coordinate, anchor: .center) {
                    NavigationLink(value: pin.route) {
                        RoutePinView(pin: pin)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .mapStyle(.standard(pointsOfInterest: .excludingAll))
        .annotationTitles(.hidden)
    }

    // MARK: Header

    private var header: some View {
        HStack(spacing: 8) {
            HStack(spacing: 9) {
                Text(store.trip?.code ?? "—")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 26, height: 26)
                    .background(Palette.jade, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                VStack(alignment: .leading, spacing: 1) {
                    Text(store.trip?.name ?? "")
                        .font(.system(size: 13, weight: .semibold))
                        .lineLimit(1)
                    Text(dayOfLine)
                        .font(.system(size: 11))
                        .foregroundStyle(Palette.muted)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 12)
            .frame(height: 44)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .shadow(color: Color.black.opacity(0.10), radius: 5, y: 2)

            Button {
                languageNotice = true
            } label: {
                Text("EN")
                    .font(.system(size: 12.5, weight: .heavy))
                    .foregroundStyle(Palette.ink)
                    .frame(width: 44, height: 44)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .shadow(color: Color.black.opacity(0.10), radius: 5, y: 2)
            }
            .buttonStyle(.plain)
            .alert("English", isPresented: $languageNotice) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("中文 is designed and will land in the next pass — every screen already reads from one string table.")
            }
        }
        .padding(.top, 8)
    }

    private var dayOfLine: String {
        guard let trip = store.trip else { return "" }
        let date = store.day(store.selectedDay)?.shortDate ?? ""
        return "Day \(store.selectedDay) of \(trip.dayCount) · \(date)"
    }

    private var legend: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 7) {
                Capsule().fill(Palette.jade).frame(width: 16, height: 3)
                Text("Main route")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Palette.ink)
            }
            HStack(spacing: 7) {
                Line()
                    .stroke(Palette.amber, style: StrokeStyle(lineWidth: 2.5, dash: [2, 3]))
                    .frame(width: 16, height: 2)
                Text("Sub route")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Palette.muted)
            }
        }
        .padding(.horizontal, 11)
        .padding(.vertical, 9)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    // MARK: Sheet

    private let sheetHeight: CGFloat = 300

    private var todaySheet: some View {
        VStack(spacing: 0) {
            Button {
                openPlan(editing: false)
            } label: {
                VStack(spacing: 10) {
                    SheetGrabber()
                        .padding(.top, 10)
                    HStack(alignment: .bottom, spacing: 10) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("DAY \(store.selectedDay) · \(store.day(store.selectedDay)?.dateLabel.uppercased() ?? "")")
                                .font(.system(size: 11, weight: .bold))
                                .tracking(0.9)
                                .foregroundStyle(Palette.muted)
                            Text(dayTitle)
                                .font(Typo.sheetTitle())
                                .foregroundStyle(Palette.ink)
                                .lineLimit(1)
                        }
                        Spacer(minLength: 0)
                        if let anchor = store.anchorItem, let placeID = anchor.placeID {
                            NavigationLink(value: Route.nearby(anchorPlaceID: placeID)) {
                                Text("Nearby")
                                    .font(.system(size: 12.5, weight: .bold))
                                    .foregroundStyle(Palette.amberInk)
                                    .padding(.horizontal, 12)
                                    .frame(height: 38)
                                    .background(Palette.amberSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                                    .overlay {
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .strokeBorder(Palette.amberSoftBorder, lineWidth: 1)
                                    }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 16)
                }
            }
            .buttonStyle(.plain)
            // Pulling the header up opens Plan, as the sheet suggests it should.
            .highPriorityGesture(
                DragGesture(minimumDistance: 24)
                    .onEnded { value in
                        if value.translation.height < -24 { openPlan(editing: false) }
                    }
            )

            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(stops, id: \.item.id) { row in
                        NavigationLink(value: row.route) {
                            SheetStopRow(item: row.item, isFirst: row.isFirst)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 8)
            }
            .padding(.top, 12)
        }
        .frame(height: sheetHeight)
        .frame(maxWidth: .infinity)
        .background(
            UnevenRoundedRectangle(topLeadingRadius: 22, topTrailingRadius: 22, style: .continuous)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.14), radius: 14, y: -6)
        )
        .padding(.bottom, 78)
    }

    private var dayTitle: String {
        let span = store.day(store.selectedDay)?.areaSpan ?? ""
        if !span.isEmpty { return span }
        let items = store.day(store.selectedDay)?.activeItems ?? []
        guard let first = items.first, let last = items.last, items.count > 1 else {
            return items.first?.name ?? "Nothing planned yet"
        }
        return "\(first.name) to \(last.name)"
    }

    private struct StopRow {
        let item: PlanItem
        let isFirst: Bool
        let route: Route
    }

    private var stops: [StopRow] {
        let items = store.day(store.selectedDay)?.activeItems ?? []
        return items.enumerated().map { index, item in
            StopRow(
                item: store.decorated(item),
                isFirst: index == 0,
                route: item.isSubRouteSummary ? .subRoute : .destination(planItemID: item.id)
            )
        }
    }

    // MARK: Edit button

    private var editButton: some View {
        Button {
            openPlan(editing: true)
        } label: {
            Image(systemName: "pencil")
                .font(.system(size: 19, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 52, height: 52)
                .background(Palette.ink, in: RoundedRectangle(cornerRadius: 17, style: .continuous))
                .shadow(color: Color.black.opacity(0.3), radius: 10, y: 6)
        }
        .buttonStyle(.plain)
    }

    private func openPlan(editing: Bool) {
        store.isEditingPlan = editing
        router.tab = .plan
    }

    // MARK: Geometry

    private var mainCoordinates: [CLLocationCoordinate2D] {
        (store.day(store.selectedDay)?.activeItems ?? [])
            .filter { $0.kind == .main }
            .compactMap(\.coordinate)
    }

    private var subLoopCoordinates: [CLLocationCoordinate2D] {
        guard let route = store.currentSubRoute,
              let anchor = store.planItem(route.anchorPlanItemID)?.coordinate else { return [] }
        let stops = route.placeIDs.compactMap { store.place($0)?.coordinate }
        guard !stops.isEmpty else { return [] }
        return [anchor] + stops + [anchor]
    }

    private var pins: [MapPinModel] {
        guard let day = store.day(store.selectedDay) else { return [] }
        let numbers = store.mainStopNumbers(for: day)
        let anchorID = store.currentSubRoute?.anchorPlanItemID

        var result: [MapPinModel] = []
        var seen = Set<String>()

        for item in day.activeItems where item.kind == .main {
            guard let coordinate = item.coordinate else { continue }
            // The hotel opens and closes the day; one pin is enough.
            let key = String(format: "%.5f,%.5f", coordinate.latitude, coordinate.longitude)
            guard seen.insert(key).inserted else { continue }
            result.append(MapPinModel(
                id: item.id,
                name: item.name,
                coordinate: coordinate,
                number: numbers[item.id],
                isAnchor: item.id == anchorID,
                route: .destination(planItemID: item.id)
            ))
        }

        if let route = store.currentSubRoute {
            for id in route.placeIDs {
                guard let place = store.place(id), let coordinate = place.coordinate else { continue }
                result.append(MapPinModel(
                    id: place.id,
                    name: place.name,
                    coordinate: coordinate,
                    number: nil,
                    isAnchor: false,
                    route: .placeDetail(placeID: place.id)
                ))
            }
        }

        return result
    }

    private func focusOnDay() {
        let coordinates = mainCoordinates + subLoopCoordinates
        guard !coordinates.isEmpty else { return }
        camera = .region(MKCoordinateRegion(fitting: coordinates))
    }
}

// MARK: - Pins

struct MapPinModel: Identifiable {
    let id: String
    let name: String
    let coordinate: CLLocationCoordinate2D
    /// Main-route stops are numbered; the traveller's own stops are not.
    let number: Int?
    /// The stop with slack, drawn dark — free time is entered from here.
    let isAnchor: Bool
    let route: Route
}

private struct RoutePinView: View {
    let pin: MapPinModel

    var body: some View {
        if let number = pin.number {
            Text("\(number)")
                .font(.system(size: pin.isAnchor ? 15 : 13, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: pin.isAnchor ? 40 : 32, height: pin.isAnchor ? 40 : 32)
                .background(Circle().fill(pin.isAnchor ? Palette.ink : Palette.jade))
                .shadow(color: Color.black.opacity(0.18), radius: 3, y: 1)
        } else {
            Circle()
                .fill(Color.white)
                .frame(width: 18, height: 18)
                .overlay { Circle().strokeBorder(Palette.amber, lineWidth: 2.5) }
                .shadow(color: Color.black.opacity(0.15), radius: 2, y: 1)
        }
    }
}

private struct SheetStopRow: View {
    let item: PlanItem
    let isFirst: Bool

    var body: some View {
        VStack(spacing: 0) {
            if !isFirst {
                Rectangle().fill(Palette.rule).frame(height: 1)
            }
            HStack(spacing: 12) {
                Text(item.time)
                    .font(.system(size: 12.5, weight: .bold))
                    .monospacedDigit()
                    .frame(width: 44, alignment: .leading)
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.name)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Palette.ink)
                    Text(item.note)
                        .font(Typo.meta())
                        .foregroundStyle(Palette.muted)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
                if item.kind == .main { Badge.main() } else { Badge.sub() }
            }
            .padding(.vertical, 11)
        }
    }
}

extension MKCoordinateRegion {
    /// Region that fits every coordinate with a little breathing room.
    init(fitting coordinates: [CLLocationCoordinate2D]) {
        let latitudes = coordinates.map(\.latitude)
        let longitudes = coordinates.map(\.longitude)
        let minLat = latitudes.min() ?? 0
        let maxLat = latitudes.max() ?? 0
        let minLon = longitudes.min() ?? 0
        let maxLon = longitudes.max() ?? 0

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2
        )
        // The sheet covers the lower third, so pad latitude harder.
        let span = MKCoordinateSpan(
            latitudeDelta: max((maxLat - minLat) * 2.6, 0.012),
            longitudeDelta: max((maxLon - minLon) * 1.5, 0.012)
        )
        self.init(center: center, span: span)
    }
}
