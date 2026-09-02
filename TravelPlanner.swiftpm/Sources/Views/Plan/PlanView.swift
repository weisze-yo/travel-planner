import SwiftUI

/// Screen 2b — the day as one column with two authorships: agent stops on a
/// solid jade line, the traveller's own on a dashed amber one. Edit mode turns
/// the column into something you can drag, retime, remove and add to.
struct PlanView: View {
    @EnvironmentObject private var store: TripStore

    @State private var addStopOpen = false
    @State private var newStopPlaceID: String = ""
    @State private var newStopTime: String = ""

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(spacing: 0) {
                    WeatherBanner(
                        weather: store.weatherToday,
                        dayNumber: store.selectedDay,
                        source: store.weatherSourceLine
                    )
                    .padding(.bottom, 14)

                    if store.isEditingPlan {
                        Text("Hold the handle to drag a stop into place")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Palette.amberInk)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .background(Palette.amberSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay {
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .strokeBorder(Palette.amberSoftBorder, lineWidth: 1)
                            }
                            .padding(.bottom, 12)
                    }

                    ForEach(items) { item in
                        PlanRow(
                            item: store.decorated(item),
                            isLast: item.id == items.last?.id,
                            editing: store.isEditingPlan,
                            onTime: { store.updatePlanItemTime(item.id, in: store.selectedDay, to: $0) },
                            onRemove: { store.archivePlanItem(item.id, in: store.selectedDay) }
                        )
                        .dropDestination(for: String.self) { dragged, _ in
                            guard let draggedID = dragged.first else { return false }
                            store.movePlanItem(draggedID, onto: item.id, in: store.selectedDay)
                            return true
                        }
                    }

                    if items.isEmpty {
                        Text("Nothing planned for this day yet.")
                            .font(Typo.meta())
                            .foregroundStyle(Palette.muted)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 18)
                    }

                    if store.isEditingPlan {
                        editingTools
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 120)
            }
        }
        .background(Palette.bone)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var items: [PlanItem] {
        store.day(store.selectedDay)?.activeItems ?? []
    }

    // MARK: Header

    private var header: some View {
        VStack(spacing: 10) {
            HStack(alignment: .bottom, spacing: 8) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Day \(store.selectedDay)")
                        .font(Typo.screenTitle())
                    Text(store.day(store.selectedDay)?.dateLabel ?? "")
                        .font(.system(size: 12))
                        .foregroundStyle(Palette.muted)
                }
                Spacer(minLength: 0)
                Button {
                    store.isEditingPlan.toggle()
                    if !store.isEditingPlan { addStopOpen = false }
                } label: {
                    Text(store.isEditingPlan ? "Done" : "Edit")
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(store.isEditingPlan ? .white : Palette.charcoal)
                        .padding(.horizontal, 13)
                        .frame(height: 36)
                        .background(store.isEditingPlan ? Palette.jade : Palette.bone,
                                    in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            DayPillRow(
                days: store.days,
                weather: { store.weather($0) },
                selected: $store.selectedDay,
                compact: true
            )
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 10)
        .background(Color.white)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Palette.border).frame(height: 1)
        }
    }

    // MARK: Edit mode extras

    private var editingTools: some View {
        VStack(spacing: 0) {
            if addStopOpen {
                addStopForm
                    .padding(.top, 4)
            }

            DashedAddButton(title: "+ Add a stop") {
                addStopOpen.toggle()
            }
            .padding(.top, 8)

            if let day = store.day(store.selectedDay), !day.archivedItems.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("REMOVED FROM THIS DAY")
                        .sectionLabelStyle()
                        .padding(.top, 20)
                    ForEach(day.archivedItems) { item in
                        ArchivedStopCard(item: item)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var addStopForm: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Add a stop")
                .font(.system(size: 12.5, weight: .heavy))

            Picker("Place", selection: $newStopPlaceID) {
                Text("From saved or nearby places").tag("")
                ForEach(store.places) { place in
                    Text(place.name).tag(place.id)
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

            HStack(spacing: 8) {
                TextField("Time", text: $newStopTime)
                    .font(.system(size: 13))
                    .textFieldStyle(.plain)
                    .padding(.horizontal, 10)
                    .frame(width: 96, height: 38)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .strokeBorder(Palette.field, lineWidth: 1)
                    }

                Button {
                    guard let place = store.place(newStopPlaceID) else { return }
                    store.addPlanItem(
                        name: place.name,
                        time: newStopTime,
                        in: store.selectedDay,
                        placeID: place.id
                    )
                    newStopPlaceID = ""
                    newStopTime = ""
                    addStopOpen = false
                } label: {
                    Text("Add")
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 38)
                        .background(Palette.jade, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(newStopPlaceID.isEmpty)
                .opacity(newStopPlaceID.isEmpty ? 0.5 : 1)

                Button {
                    addStopOpen = false
                    newStopPlaceID = ""
                    newStopTime = ""
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Palette.muted)
                        .frame(width: 38, height: 38)
                        .background(Palette.bone, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            Text("Pick from places you have saved or added nearby. It drops into the day at the time you set, and you can drag it afterwards.")
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
}

// MARK: - Rows

private struct PlanRow: View {
    let item: PlanItem
    let isLast: Bool
    let editing: Bool
    let onTime: (String) -> Void
    let onRemove: () -> Void

    @State private var timeText: String = ""

    private var isSub: Bool { item.kind == .sub }

    var body: some View {
        HStack(alignment: .top, spacing: 9) {
            if editing {
                DragHandle()
                    .frame(width: 26)
                    .padding(.top, 20)
                    .draggable(item.id) {
                        Text(item.name)
                            .font(.system(size: 12, weight: .semibold))
                            .padding(8)
                            .background(Color.white)
                    }
            }

            timeColumn

            connector

            card
        }
    }

    private var timeColumn: some View {
        VStack(alignment: .trailing, spacing: 1) {
            if editing {
                TextField("", text: $timeText)
                    .font(.system(size: 11.5))
                    .monospacedDigit()
                    .multilineTextAlignment(.center)
                    .textFieldStyle(.plain)
                    .padding(.vertical, 5)
                    .frame(width: 52)
                    .background(Color.white, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .strokeBorder(Palette.field, lineWidth: 1)
                    }
                    .onAppear { timeText = item.time }
                    .onSubmit { onTime(timeText) }
                    .onChange(of: timeText) { _, new in
                        if new.count == 5 { onTime(new) }
                    }
            } else {
                Text(item.time)
                    .font(.system(size: 12.5, weight: .bold))
                    .monospacedDigit()
                Text(item.durationLabel)
                    .font(.system(size: 10.5, weight: .semibold))
                    .foregroundStyle(Palette.soft)
            }
        }
        .frame(width: 52, alignment: .trailing)
        .padding(.top, 12)
    }

    private var connector: some View {
        VStack(spacing: 0) {
            Circle()
                .fill(isSub ? Color.white : Palette.jade)
                .frame(width: 11, height: 11)
                .overlay {
                    if isSub {
                        Circle().strokeBorder(Palette.amber, lineWidth: 2.5)
                    }
                }
                .padding(.top, 14)
            if !isLast {
                Line(vertical: true)
                    .stroke(
                        isSub ? Palette.amberDashed : Palette.timeline,
                        style: StrokeStyle(lineWidth: 2, dash: isSub ? [4, 4] : [])
                    )
                    .frame(width: 2)
                    .frame(maxHeight: .infinity)
            }
        }
        .frame(width: 20)
        .frame(maxHeight: .infinity)
    }

    private var card: some View {
        NavigationLink(value: item.isSubRouteSummary ? Route.subRoute : Route.destination(planItemID: item.id)) {
            VStack(alignment: .leading, spacing: 9) {
                HStack(alignment: .top, spacing: 8) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(item.name)
                            .font(Typo.cardTitle())
                            .foregroundStyle(Palette.ink)
                            .multilineTextAlignment(.leading)
                        if !item.note.isEmpty {
                            Text(item.note)
                                .font(Typo.meta())
                                .foregroundStyle(Palette.muted)
                                .multilineTextAlignment(.leading)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    Spacer(minLength: 0)
                    if editing {
                        Button(action: onRemove) {
                            Image(systemName: "xmark")
                                .font(.system(size: 12, weight: .heavy))
                                .foregroundStyle(Palette.danger)
                                .frame(width: 26, height: 26)
                                .background(Palette.dangerSoft, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    } else if isSub {
                        Badge.sub()
                    } else {
                        Badge.main()
                    }
                }

                if !item.chips.isEmpty {
                    HStack(spacing: 6) {
                        ForEach(item.chips, id: \.self) { chip in
                            Chip(label: chip, background: Palette.bone, foreground: Palette.charcoal, weight: .semibold)
                        }
                    }
                }
            }
            .padding(.horizontal, 13)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isSub ? Palette.amberCardBg : Color.white,
                        in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(
                        isSub ? Palette.amberDashed : Palette.border,
                        style: StrokeStyle(lineWidth: isSub ? 1.5 : 1, dash: isSub ? [4, 3] : [])
                    )
            }
            .padding(.bottom, 8)
        }
        .buttonStyle(.plain)
        .disabled(editing)
    }
}

/// A removed stop, waiting to be added back or moved to another day.
private struct ArchivedStopCard: View {
    @EnvironmentObject private var store: TripStore
    let item: PlanItem

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(alignment: .top, spacing: 8) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.name)
                        .font(.system(size: 13.5, weight: .semibold))
                        .foregroundStyle(Palette.archiveTitle)
                    Text("was \(item.time)")
                        .font(.system(size: 11))
                        .foregroundStyle(Palette.archiveBody)
                }
                Spacer(minLength: 0)
                Button {
                    store.restorePlanItem(item.id, in: store.selectedDay)
                } label: {
                    Text("Add back")
                        .font(.system(size: 11.5, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .frame(height: 28)
                        .background(Color.white.opacity(0.14), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 6) {
                Text("MOVE TO")
                    .font(.system(size: 10.5, weight: .heavy))
                    .foregroundStyle(Palette.archiveBody)
                ForEach(store.days.filter { $0.dayNumber != store.selectedDay }) { day in
                    let isOn = item.movedToDay == day.dayNumber
                    Button {
                        store.movePlanItem(item.id, from: store.selectedDay, toDay: day.dayNumber)
                    } label: {
                        Text("D\(day.dayNumber)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(isOn ? Palette.ink : Palette.archiveTitle)
                            .padding(.horizontal, 8)
                            .frame(height: 26)
                            .background(isOn ? Palette.archiveAccent : Color.white.opacity(0.14),
                                        in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }

            if let movedTo = item.movedToDay {
                Text("Moved to Day \(movedTo)")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Palette.archiveAccent)
            }
        }
        .padding(13)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.archiveCard, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

struct Line: Shape {
    var vertical = false

    func path(in rect: CGRect) -> Path {
        var path = Path()
        if vertical {
            path.move(to: CGPoint(x: rect.midX, y: 0))
            path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
        } else {
            path.move(to: CGPoint(x: 0, y: rect.midY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        }
        return path
    }
}
