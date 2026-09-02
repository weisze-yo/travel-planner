import SwiftUI

/// Screen 2h — 出行准备. The forecast strip drives the outfit lines, every
/// item can explain why it exists, and each one records where it was packed.
struct PrepView: View {
    @EnvironmentObject private var store: TripStore

    @State private var addingTo: String?
    @State private var newItem = ""
    @State private var categoryOpen = false
    @State private var newCategory = ""

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(spacing: 13) {
                    forecastCard

                    ForEach(store.prepGroups) { group in
                        PrepGroupCard(
                            group: group,
                            isAdding: addingTo == group.title,
                            newItem: $newItem,
                            onStartAdding: {
                                addingTo = group.title
                                newItem = ""
                            },
                            onSave: {
                                store.addPrepItem(name: newItem, category: group.title)
                                newItem = ""
                                addingTo = nil
                            },
                            onCancel: {
                                addingTo = nil
                                newItem = ""
                            }
                        )
                    }

                    if categoryOpen {
                        HStack(spacing: 6) {
                            TextField("Category name", text: $newCategory)
                                .textFieldStyle(.plain)
                                .font(.system(size: 13))
                                .padding(.horizontal, 10)
                                .frame(height: 37)
                                .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                                .overlay {
                                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                                        .strokeBorder(Palette.field, lineWidth: 1)
                                }
                            Button {
                                store.addPrepCategory(newCategory)
                                newCategory = ""
                                categoryOpen = false
                            } label: {
                                Text("Add")
                                    .font(.system(size: 12.5, weight: .bold))
                                    .foregroundStyle(.white)
                                    .frame(width: 58, height: 37)
                                    .background(Palette.jade, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                            }
                            .buttonStyle(.plain)
                            Button {
                                categoryOpen = false
                                newCategory = ""
                            } label: {
                                Image(systemName: "xmark")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(Palette.muted)
                                    .frame(width: 37, height: 37)
                                    .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    DashedAddButton(title: "+ New category") {
                        categoryOpen.toggle()
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, 120)
            }
        }
        .background(Palette.bone)
        .toolbar(.hidden, for: .navigationBar)
    }

    // MARK: Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Trip prep")
                .font(Typo.screenTitle())
            Text(subtitle)
                .font(.system(size: 12))
                .foregroundStyle(Palette.muted)
                .padding(.top, 2)
            ProgressTrack(value: store.prepProgress)
                .padding(.top, 12)
            Text("\(store.prepPackedCount) of \(store.prepTotalCount) packed")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Palette.muted)
                .padding(.top, 6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .background(Color.white)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Palette.border).frame(height: 1)
        }
    }

    private var subtitle: String {
        guard let trip = store.trip else { return "" }
        return "\(trip.dayCount) days · departs in \(trip.departsInDays) days"
    }

    // MARK: Forecast

    private var forecastCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                Text("WEATHER FORECAST")
                    .sectionLabelStyle()
                Spacer(minLength: 0)
                Text(store.weatherSourceLine)
                    .font(.system(size: 10.5, weight: .medium))
                    .foregroundStyle(Palette.faint)
            }

            HStack(spacing: 5) {
                ForEach(store.trip?.weather ?? [], id: \.dayNumber) { day in
                    VStack(spacing: 3) {
                        Text("D\(day.dayNumber)")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(Palette.muted)
                        Text(day.icon)
                            .font(.system(size: 16))
                        Text("\(day.high)°")
                            .font(.system(size: 10.5, weight: .bold))
                        Text(day.rainLabel)
                            .font(.system(size: 9.5, weight: .semibold))
                            .foregroundStyle(Palette.soft)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(
                        day.dayNumber == store.selectedDay ? Palette.jadeSoft : Color(hex: 0xF7F8F6),
                        in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                    )
                }
            }
            .padding(.top, 10)
        }
        .padding(.horizontal, 13)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardSurface(radius: 14)
    }
}

private struct PrepGroupCard: View {
    @EnvironmentObject private var store: TripStore

    let group: PrepGroup
    let isAdding: Bool
    @Binding var newItem: String
    let onStartAdding: () -> Void
    let onSave: () -> Void
    let onCancel: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                Text(group.title)
                    .font(.system(size: 13.5, weight: .bold))
                Spacer(minLength: 0)
                Text(group.countLabel)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(Palette.soft)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 11)

            ForEach(group.items) { item in
                VStack(spacing: 0) {
                    Rectangle().fill(Palette.hairline).frame(height: 1)
                    HStack(spacing: 11) {
                        Button { store.togglePacked(item) } label: {
                            Checkbox(isOn: item.packed, size: 21)
                        }
                        .buttonStyle(.plain)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name)
                                .font(.system(size: 13, weight: .semibold))
                                .strikethrough(item.packed)
                                .foregroundStyle(item.packed ? Palette.strike : Palette.ink)
                            if !item.why.isEmpty {
                                Text(item.why)
                                    .font(.system(size: 10.5, weight: .semibold))
                                    .foregroundStyle(Palette.amberInk)
                            }
                        }

                        Spacer(minLength: 0)

                        // Tap to move it between suitcase, carry-on and backpack.
                        Button { store.cyclePackedLocation(item) } label: {
                            Chip(
                                label: item.location.label,
                                background: item.location == .notPacked ? Palette.bone : Palette.jadeSoft,
                                foreground: item.location == .notPacked ? Palette.soft : Palette.jade
                            )
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                }
            }

            if isAdding {
                VStack(spacing: 0) {
                    Rectangle().fill(Palette.hairline).frame(height: 1)
                    HStack(spacing: 6) {
                        TextField("Item name", text: $newItem)
                            .textFieldStyle(.plain)
                            .font(.system(size: 13))
                            .padding(.horizontal, 10)
                            .frame(height: 37)
                            .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .overlay {
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .strokeBorder(Palette.field, lineWidth: 1)
                            }
                        Button(action: onSave) {
                            Text("Add")
                                .font(.system(size: 12.5, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(width: 58, height: 37)
                                .background(Palette.jade, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        Button(action: onCancel) {
                            Image(systemName: "xmark")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(Palette.muted)
                                .frame(width: 37, height: 37)
                                .background(Palette.bone, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 11)
                }
            }

            VStack(spacing: 0) {
                Rectangle().fill(Palette.hairline).frame(height: 1)
                Button(action: onStartAdding) {
                    Text("+ Add item")
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundStyle(Palette.jade)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 11)
                }
                .buttonStyle(.plain)
            }
        }
        .cardSurface()
    }
}
