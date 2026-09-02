import SwiftUI
import MapKit

/// Screen 2e — the traveller's loop off one main-route stop. Reorder by
/// dragging the handle and every arrival time and the buffer recompute; the
/// return row says where you are heading back to and how long that takes.
struct SubRouteView: View {
    @EnvironmentObject private var store: TripStore
    @Environment(\.dismiss) private var dismiss

    @State private var camera: MapCameraPosition = .automatic
    @State private var returnEditorOpen = false
    @State private var returnMinutesText = ""

    var body: some View {
        ZStack(alignment: .top) {
            mapLayer
                .ignoresSafeArea()

            header
                .padding(.horizontal, 16)
        }
        .overlay(alignment: .bottom) {
            if let route = store.currentSubRoute {
                sheet(route: route, schedule: store.schedule(for: route))
            }
        }
        .background(Palette.bone)
        .toolbar(.hidden, for: .navigationBar)
        .onAppear {
            returnMinutesText = String(store.currentSubRoute?.returnMinutes ?? 8)
            focus()
        }
    }

    // MARK: Map

    private var mapLayer: some View {
        Map(position: $camera, interactionModes: .all) {
            if approachCoordinates.count > 1 {
                MapPolyline(coordinates: approachCoordinates)
                    .stroke(Palette.jade, style: StrokeStyle(lineWidth: 5.5, lineCap: .round))
            }
            if loopCoordinates.count > 1 {
                MapPolyline(coordinates: loopCoordinates)
                    .stroke(Palette.amber, style: StrokeStyle(lineWidth: 3.5, lineCap: .round, dash: [3, 7]))
            }
            if let anchor = anchorItem, let coordinate = anchor.coordinate,
               let day = store.day(store.selectedDay) {
                let number = store.mainStopNumbers(for: day)[anchor.id]
                Annotation(anchor.name, coordinate: coordinate, anchor: .center) {
                    Text(number.map(String.init) ?? "•")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(.white)
                        .frame(width: 36, height: 36)
                        .background(Circle().fill(Palette.ink))
                }
            }
            ForEach(store.currentSchedule?.stops ?? []) { stop in
                if let coordinate = stop.place.coordinate {
                    Annotation(stop.place.name, coordinate: coordinate, anchor: .center) {
                        Text("\(stop.index)")
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(.white)
                            .frame(width: 28, height: 28)
                            .background(Circle().fill(Palette.amber))
                    }
                }
            }
        }
        .mapStyle(.standard(pointsOfInterest: .excludingAll))
        .annotationTitles(.hidden)
    }

    private var anchorItem: PlanItem? {
        guard let route = store.currentSubRoute else { return nil }
        return store.planItem(route.anchorPlanItemID)
    }

    /// The main-route leg arriving at the anchor stop, for context.
    private var approachCoordinates: [CLLocationCoordinate2D] {
        guard let day = store.day(store.selectedDay), let anchor = anchorItem else { return [] }
        let mains = day.activeItems.filter { $0.kind == .main }
        guard let index = mains.firstIndex(where: { $0.id == anchor.id }), index > 0 else { return [] }
        return [mains[index - 1], mains[index]].compactMap(\.coordinate)
    }

    private var loopCoordinates: [CLLocationCoordinate2D] {
        guard let anchor = anchorItem?.coordinate,
              let schedule = store.currentSchedule else { return [] }
        let stops = schedule.stops.compactMap(\.place.coordinate)
        guard !stops.isEmpty else { return [] }
        return [anchor] + stops + [anchor]
    }

    private func focus() {
        let coordinates = loopCoordinates + approachCoordinates
        guard !coordinates.isEmpty else { return }
        camera = .region(MKCoordinateRegion(fitting: coordinates))
    }

    // MARK: Header

    private var header: some View {
        HStack(spacing: 10) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Palette.ink)
                    .frame(width: 40, height: 40)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 13, style: .continuous))
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 1) {
                Text(subtitleTitle)
                    .font(.system(size: 13.5, weight: .bold))
                Text(subtitleLine)
                    .font(Typo.meta())
                    .foregroundStyle(Palette.muted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 13, style: .continuous))
        }
        .padding(.top, 8)
    }

    private var subtitleTitle: String {
        guard let day = store.day(store.selectedDay), let anchor = anchorItem else { return "Sub route" }
        if let number = store.mainStopNumbers(for: day)[anchor.id] {
            return "Sub route · Stop \(number)"
        }
        return "Sub route"
    }

    private var subtitleLine: String {
        guard let route = store.currentSubRoute, let schedule = store.currentSchedule else { return "" }
        return "\(route.placeIDs.count) stops · out \(Fmt.clock(route.startMinutes)), back \(Fmt.clock(schedule.returnClock))"
    }

    // MARK: Sheet

    private func sheet(route: SubRoute, schedule: SubRouteSchedule) -> some View {
        VStack(spacing: 0) {
            SheetGrabber()
                .padding(.top, 10)
                .padding(.bottom, 12)

            HStack(spacing: 8) {
                StatTile(label: "MOVING", value: Fmt.duration(schedule.movingMinutes))
                StatTile(label: "AT STOPS", value: Fmt.duration(schedule.stayMinutes))
                StatTile(
                    label: "BUFFER",
                    value: Fmt.duration(abs(schedule.bufferMinutes)),
                    background: schedule.isTight ? Palette.dangerSoft : Palette.jadeSoft,
                    foreground: schedule.isTight ? Palette.danger : Palette.jade
                )
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 10)

            Text("Hold the handle to drag a stop into place")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Palette.soft)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.bottom, 8)

            ScrollView {
                VStack(spacing: 0) {
                    ForEach(schedule.stops) { stop in
                        LoopStopRow(stop: stop)
                            .dropDestination(for: String.self) { dragged, _ in
                                guard let draggedID = dragged.first else { return false }
                                store.moveSubRouteStop(draggedID, onto: stop.place.id)
                                return true
                            }
                    }

                    if schedule.stops.isEmpty {
                        Text("No stops yet — add places from Nearby.")
                            .font(Typo.meta())
                            .foregroundStyle(Palette.muted)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 16)
                    }

                    returnRow(route: route, schedule: schedule)

                    Button {
                        MapLinks.open(MapLinks.walkingRoute(loopCoordinates))
                    } label: {
                        Text("Send walk to Maps")
                            .font(.system(size: 12.5, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                            .background(Palette.ink, in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 12)
                    .disabled(loopCoordinates.count < 2)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(maxHeight: 520)
        .background(
            UnevenRoundedRectangle(topLeadingRadius: 22, topTrailingRadius: 22, style: .continuous)
                .fill(Color.white)
                .shadow(color: Color.black.opacity(0.14), radius: 14, y: -6)
        )
        .padding(.bottom, 78)
    }

    private func returnRow(route: SubRoute, schedule: SubRouteSchedule) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Rectangle().fill(Palette.rule).frame(height: 1)

            HStack(spacing: 10) {
                Image(systemName: "arrow.uturn.left")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(width: 26, height: 26)
                    .background(Circle().fill(Palette.ink))
                    .padding(.leading, 22)

                VStack(alignment: .leading, spacing: 1) {
                    Text(store.returnLabel(for: route.returnTarget, route: route))
                        .font(Typo.rowTitle())
                    Text(schedule.bufferLine)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(schedule.isTight ? Palette.danger : Palette.jade)
                }

                Spacer(minLength: 0)

                Text(Fmt.clock(schedule.returnClock))
                    .font(.system(size: 12, weight: .bold))
                    .monospacedDigit()

                Button {
                    returnEditorOpen.toggle()
                } label: {
                    Image(systemName: "pencil")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Palette.charcoal)
                        .frame(width: 30, height: 30)
                        .background(Palette.bone, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            .padding(.vertical, 11)

            if returnEditorOpen {
                returnEditor(route: route)
            }
        }
    }

    private func returnEditor(route: SubRoute) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("BACK TO")
                .sectionLabelStyle()

            Picker("Back to", selection: Binding(
                get: { route.returnTarget },
                set: { store.setReturnTarget($0) }
            )) {
                ForEach(ReturnTarget.allCases, id: \.self) { target in
                    Text(store.returnLabel(for: target, route: route)).tag(target)
                }
            }
            .pickerStyle(.menu)
            .tint(Palette.ink)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 10)
            .frame(height: 40)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(Palette.field, lineWidth: 1)
            }

            Text("TIME NEEDED")
                .sectionLabelStyle()

            HStack(spacing: 8) {
                TextField("8", text: $returnMinutesText)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13))
                    .keyboardType(.numberPad)
                    .padding(.horizontal, 10)
                    .frame(width: 88, height: 38)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .strokeBorder(Palette.field, lineWidth: 1)
                    }
                    .onChange(of: returnMinutesText) { _, new in
                        if let minutes = Int(new) { store.setReturnMinutes(minutes) }
                    }

                Text("minutes")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Palette.muted)

                Button {
                    returnEditorOpen = false
                } label: {
                    Text("Done")
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 38)
                        .background(Palette.jade, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: 0xF7F8F6), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .padding(.top, 10)
        .padding(.bottom, 4)
    }
}

private struct LoopStopRow: View {
    let stop: ScheduledStop

    var body: some View {
        VStack(spacing: 0) {
            Rectangle().fill(Palette.rule).frame(height: 1)
            HStack(spacing: 10) {
                DragHandle()
                    .frame(width: 22)
                    .draggable(stop.place.id) {
                        Text(stop.place.name)
                            .font(.system(size: 12, weight: .semibold))
                            .padding(8)
                            .background(Color.white)
                    }

                Text("\(stop.index)")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(.white)
                    .frame(width: 26, height: 26)
                    .background(Circle().fill(Palette.amber))

                VStack(alignment: .leading, spacing: 1) {
                    Text(stop.place.name)
                        .font(Typo.rowTitle())
                    Text(stop.metaLine)
                        .font(.system(size: 11))
                        .foregroundStyle(Palette.muted)
                        .lineLimit(1)
                }

                Spacer(minLength: 0)

                Text(stop.arrivalLabel)
                    .font(.system(size: 12, weight: .bold))
                    .monospacedDigit()
            }
            .padding(.vertical, 10)
        }
    }
}
