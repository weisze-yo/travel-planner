import SwiftUI

/// Screen 2i — the log. Days seed themselves from what actually happened:
/// photos, spend, shots hit and missed. Tap a day to write or edit its note.
struct LogView: View {
    @EnvironmentObject private var store: TripStore

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(store.logEntries) { entry in
                        NavigationLink(value: Route.note(dayNumber: entry.dayNumber, placeID: entry.destinationPlaceID)) {
                            LogEntryCard(entry: entry)
                        }
                        .buttonStyle(.plain)
                    }

                    recapCard
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, 120)
            }
        }
        .background(Palette.bone)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Log")
                .font(Typo.screenTitle())
            Text(subtitle)
                .font(.system(size: 12))
                .foregroundStyle(Palette.muted)
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
        let recorded = store.logEntries.filter { !$0.text.isEmpty }.count
        let name = trip.name.components(separatedBy: " · ").first ?? trip.name
        return "\(name) · \(recorded) of \(trip.dayCount) days recorded"
    }

    private var recapCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("AFTER THE TRIP")
                .sectionLabelStyle(Palette.onDarkLabel)
            Text("Trip recap")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
                .padding(.top, 5)
            Text(SeedData.recapText)
                .font(.system(size: 12.5))
                .lineSpacing(2)
                .foregroundStyle(Palette.onDarkBody)
                .padding(.top, 6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Palette.ink, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct LogEntryCard: View {
    let entry: LogEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text("\(entry.dayLabel) · \(entry.dateLabel)")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Palette.ink)
                Spacer(minLength: 0)
                Text(entry.meta)
                    .font(.system(size: 11.5, weight: .semibold))
                    .foregroundStyle(entry.metaIsLive ? Palette.amber : Palette.muted)
            }

            if !entry.destinationLabel.isEmpty {
                Text(entry.destinationLabel)
                    .font(.system(size: 11.5, weight: .semibold))
                    .foregroundStyle(Palette.jade)
                    .padding(.top, 4)
            }

            if !entry.photoPaths.isEmpty {
                HStack(spacing: 6) {
                    ForEach(entry.photoPaths.prefix(4), id: \.self) { path in
                        StoragePhoto(path: path)
                            .aspectRatio(1, contentMode: .fill)
                            .frame(maxWidth: .infinity)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                }
                .padding(.top, 11)
            } else if entry.photoCount > 0 {
                HStack(spacing: 6) {
                    ForEach(0..<3, id: \.self) { _ in
                        PhotoPlaceholder(label: nil, radius: 10)
                            .aspectRatio(1, contentMode: .fill)
                            .frame(maxWidth: .infinity)
                    }
                    Text("+\(entry.photoCount - 3)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Palette.muted)
                        .frame(maxWidth: .infinity)
                        .aspectRatio(1, contentMode: .fill)
                        .background(Palette.bone, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .padding(.top, 11)
            }

            if !entry.text.isEmpty {
                Text(entry.text)
                    .font(.system(size: 12.5))
                    .lineSpacing(3)
                    .foregroundStyle(Palette.charcoal)
                    .multilineTextAlignment(.leading)
                    .padding(.top, 11)
            }

            if !entry.chips.isEmpty {
                HStack(spacing: 6) {
                    ForEach(entry.chips, id: \.label) { chip in
                        Chip(
                            label: chip.label,
                            background: background(for: chip.tone),
                            foreground: foreground(for: chip.tone),
                            size: 11
                        )
                    }
                }
                .padding(.top, 11)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .cardSurface()
    }

    private func background(for tone: ChipTone) -> Color {
        switch tone {
        case .jade: return Palette.jadeSoft
        case .amber: return Palette.amberSoft
        case .neutral: return Palette.bone
        }
    }

    private func foreground(for tone: ChipTone) -> Color {
        switch tone {
        case .jade: return Palette.jade
        case .amber: return Palette.amberInk
        case .neutral: return Palette.charcoal
        }
    }
}
