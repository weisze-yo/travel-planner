import SwiftUI
import PhotosUI

/// Screen 2j — the note composer: which day, which place, what happened.
/// Reached from a place screen or by tapping a day in the log. The day's spend
/// comes from the shopping list, so there is nothing to type here.
struct NoteComposerView: View {
    @EnvironmentObject private var store: TripStore
    @Environment(\.dismiss) private var dismiss

    let dayNumber: Int
    let placeID: String?

    @State private var selectedDay: Int
    @State private var selectedPlaceID: String?
    @State private var text = ""
    @State private var photoSelection: [PhotosPickerItem] = []
    @State private var isUploading = false
    @State private var loaded = false

    init(dayNumber: Int, placeID: String?) {
        self.dayNumber = dayNumber
        self.placeID = placeID
        _selectedDay = State(initialValue: dayNumber)
        _selectedPlaceID = State(initialValue: placeID)
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Text("WHICH DAY")
                        .sectionLabelStyle()

                    dayChips
                        .padding(.top, 8)

                    Text(dateLine)
                        .font(Typo.meta())
                        .foregroundStyle(Palette.muted)
                        .padding(.top, 8)

                    Text("WHICH PLACE")
                        .sectionLabelStyle()
                        .padding(.top, 18)

                    VStack(spacing: 6) {
                        ForEach(placeOptions, id: \.id) { option in
                            Button {
                                selectedPlaceID = option.id
                            } label: {
                                HStack(spacing: 10) {
                                    RadioDot(isOn: selectedPlaceID == option.id)
                                    Text(option.label)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundStyle(Palette.ink)
                                    Spacer(minLength: 0)
                                    Text(option.time)
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundStyle(Palette.soft)
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 11)
                                .background(Color.white, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay {
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .strokeBorder(selectedPlaceID == option.id ? Palette.jade : Palette.border,
                                                      lineWidth: 1.5)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.top, 8)

                    Text("NOTE")
                        .sectionLabelStyle()
                        .padding(.top, 18)

                    TextEditor(text: $text)
                        .font(.system(size: 13))
                        .lineSpacing(3)
                        .scrollContentBackground(.hidden)
                        .padding(8)
                        .frame(height: 120)
                        .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .overlay {
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .strokeBorder(Palette.field, lineWidth: 1)
                        }
                        .overlay(alignment: .topLeading) {
                            if text.isEmpty {
                                Text("What happened, what to remember next time…")
                                    .font(.system(size: 13))
                                    .foregroundStyle(Palette.soft)
                                    .padding(.horizontal, 13)
                                    .padding(.top, 16)
                                    .allowsHitTesting(false)
                            }
                        }
                        .padding(.top, 8)

                    PhotosPicker(selection: $photoSelection, maxSelectionCount: 10, matching: .images) {
                        HStack(spacing: 8) {
                            if isUploading { ProgressView().controlSize(.small) }
                            Text(isUploading ? "Uploading…" : "+ Photos")
                        }
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundStyle(Palette.muted)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background {
                            RoundedRectangle(cornerRadius: 13, style: .continuous)
                                .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
                                .foregroundStyle(Palette.dashed)
                        }
                    }
                    .padding(.top, 10)
                    .onChange(of: photoSelection) { _, items in
                        Task { await upload(items) }
                    }

                    if let entry = store.logEntry(day: selectedDay), !entry.photoPaths.isEmpty {
                        HStack(spacing: 6) {
                            ForEach(entry.photoPaths.prefix(4), id: \.self) { path in
                                StoragePhoto(path: path)
                                    .aspectRatio(1, contentMode: .fill)
                                    .frame(maxWidth: .infinity)
                                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            }
                        }
                        .padding(.top, 10)
                    }

                    Text("Spend for this day is totalled from your shopping list, so there is nothing to enter here.")
                        .font(.system(size: 11))
                        .foregroundStyle(Palette.soft)
                        .lineSpacing(2)
                        .padding(.top, 10)
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 120)
            }
        }
        .background(Palette.bone)
        .toolbar(.hidden, for: .navigationBar)
        .onAppear { loadExisting() }
        .onChange(of: selectedDay) { _, _ in loadExisting(force: true) }
    }

    // MARK: Header

    private var header: some View {
        HStack(spacing: 8) {
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Palette.ink)
                    .frame(width: 32, height: 32)
            }
            .buttonStyle(.plain)

            Text(store.logEntry(day: selectedDay)?.text.isEmpty == false ? "Edit note" : "New note")
                .font(.system(size: 18, weight: .bold))

            Spacer(minLength: 0)

            Button {
                store.saveNote(
                    dayNumber: selectedDay,
                    destinationPlaceID: selectedPlaceID,
                    destinationLabel: placeOptions.first { $0.id == selectedPlaceID }?.label ?? "",
                    text: text
                )
                dismiss()
            } label: {
                Text("Save")
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 13)
                    .frame(height: 36)
                    .background(Palette.jade, in: RoundedRectangle(cornerRadius: 11, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .background(Color.white)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Palette.border).frame(height: 1)
        }
    }

    private var dayChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(store.days) { day in
                    let isOn = day.dayNumber == selectedDay
                    Button {
                        selectedDay = day.dayNumber
                    } label: {
                        Text("D\(day.dayNumber)")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(isOn ? .white : Palette.muted)
                            .padding(.horizontal, 11)
                            .frame(height: 34)
                            .background(isOn ? Palette.ink : Color.white,
                                        in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .overlay {
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .strokeBorder(isOn ? Palette.ink : Palette.field, lineWidth: 1)
                            }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var dateLine: String {
        let date = store.day(selectedDay)?.dateLabel ?? ""
        let city = store.trip?.name.components(separatedBy: " · ").first ?? ""
        return [date, city].filter { !$0.isEmpty }.joined(separator: " · ")
    }

    // MARK: Place options

    private struct PlaceOption {
        let id: String
        let label: String
        let time: String
    }

    /// Both routes are offered: the agent's stops and the traveller's own.
    private var placeOptions: [PlaceOption] {
        var options: [PlaceOption] = []
        for item in store.day(selectedDay)?.activeItems ?? [] where !item.isSubRouteSummary {
            options.append(PlaceOption(id: item.placeID ?? item.id, label: item.name, time: item.time))
        }
        if let route = store.subRoute(forDay: selectedDay) {
            for stop in store.schedule(for: route).stops {
                options.append(PlaceOption(
                    id: stop.place.id,
                    label: "\(stop.place.name) (sub)",
                    time: stop.arrivalLabel
                ))
            }
        }
        return options
    }

    // MARK: Loading and photos

    private func loadExisting(force: Bool = false) {
        guard force || !loaded else { return }
        loaded = true
        if let entry = store.logEntry(day: selectedDay) {
            text = entry.text
            if selectedPlaceID == nil { selectedPlaceID = entry.destinationPlaceID }
        } else if force {
            text = ""
        }
    }

    private func upload(_ items: [PhotosPickerItem]) async {
        guard !items.isEmpty else { return }
        isUploading = true
        var payload: [Data] = []
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self) {
                payload.append(data)
            }
        }
        await store.addPhotos(payload, day: selectedDay)
        photoSelection = []
        isUploading = false
    }
}
