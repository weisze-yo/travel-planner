import SwiftUI
import MapKit

/// Screen 2g — the shots this stop is known for, so nothing gets missed, plus
/// what to wear based on the day's real forecast and a record of what the
/// traveller is actually bringing.
struct MustSeeView: View {
    @EnvironmentObject private var store: TripStore
    @Environment(\.dismiss) private var dismiss

    let placeID: String

    @State private var newPiece = ""

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(shots) { shot in
                        ShotCard(shot: shot) { store.toggleCaptured(shot) }
                    }
                    outfitCard
                    standHereCard
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 120)
            }
        }
        .background(Palette.bone)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var shots: [MustSeeShot] { store.shots(forPlace: placeID) }

    private var placeName: String {
        store.place(placeID)?.name
            ?? store.day(store.selectedDay)?.activeItems.first { $0.placeID == placeID }?.name
            ?? "This stop"
    }

    private var header: some View {
        HStack(spacing: 8) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(Palette.ink)
                    .frame(width: 32, height: 32)
            }
            .buttonStyle(.plain)
            VStack(alignment: .leading, spacing: 1) {
                Text("Must-see")
                    .font(Typo.pushTitle())
                Text("\(placeName) · \(shots.count) known shots")
                    .font(Typo.meta())
                    .foregroundStyle(Palette.muted)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .background(Color.white)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Palette.border).frame(height: 1)
        }
    }

    // MARK: Outfit

    private var weather: DayWeather? { store.weatherToday }

    private var suggestionChips: [String] { OutfitAdvice.chips(for: weather) }

    private var myOutfit: [String] { store.outfitPieces(day: store.selectedDay) }

    private var outfitCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 9) {
                Text("OUTFIT")
                    .sectionLabelStyle()
                Spacer(minLength: 0)
                Text(weather?.shortLine ?? "No forecast")
                    .font(.system(size: 11.5, weight: .bold))
                    .foregroundStyle(Palette.jade)
            }

            HStack(alignment: .top, spacing: 12) {
                PhotoPlaceholder(label: "reference")
                    .frame(width: 78, height: 104)
                Text(OutfitAdvice.text(for: weather, placeName: placeName))
                    .font(.system(size: 12.5))
                    .lineSpacing(2)
                    .foregroundStyle(Palette.charcoal)
            }
            .padding(.top, 10)

            HStack(spacing: 6) {
                ForEach(suggestionChips, id: \.self) { chip in
                    Chip(label: chip, background: Palette.amberSoft, foreground: Palette.amberInk, size: 11)
                }
                Chip(label: "→ added to Trip prep", background: Palette.jadeSoft, foreground: Palette.jade, size: 11)
            }
            .padding(.top, 11)

            Rectangle().fill(Palette.rule).frame(height: 1).padding(.vertical, 14)

            Text("WHAT I AM ACTUALLY BRINGING")
                .sectionLabelStyle(Palette.jade)
            Text("Your record, kept separate from the suggestion above. Syncs with Trip prep.")
                .font(Typo.meta())
                .foregroundStyle(Palette.muted)
                .padding(.top, 4)
                .fixedSize(horizontal: false, vertical: true)

            if !myOutfit.isEmpty {
                HStack(spacing: 6) {
                    ForEach(myOutfit, id: \.self) { piece in
                        Button {
                            store.removeOutfitPiece(piece, day: store.selectedDay)
                        } label: {
                            HStack(spacing: 6) {
                                Text(piece)
                                Image(systemName: "xmark")
                                    .font(.system(size: 9, weight: .bold))
                                    .opacity(0.6)
                            }
                            .font(.system(size: 11.5, weight: .bold))
                            .foregroundStyle(Palette.jade)
                            .padding(.horizontal, 9)
                            .padding(.vertical, 5)
                            .background(Palette.jadeSoft, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.top, 10)
            }

            HStack(spacing: 6) {
                TextField("Add a piece", text: $newPiece)
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
                    store.addOutfitPiece(newPiece, day: store.selectedDay)
                    newPiece = ""
                } label: {
                    Text("Add")
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 58, height: 37)
                        .background(Palette.jade, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            .padding(.top, 10)

            let picks = suggestionChips.filter { !myOutfit.contains($0.capitalizedFirst) && !myOutfit.contains($0) }
            if !picks.isEmpty {
                HStack(spacing: 6) {
                    ForEach(picks, id: \.self) { pick in
                        Button {
                            store.addOutfitPiece(pick.capitalizedFirst, day: store.selectedDay)
                        } label: {
                            Chip(label: "+ \(pick)", background: Palette.bone, foreground: Palette.charcoal,
                                 size: 11.5, weight: .semibold)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.top, 9)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardSurface()
    }

    // MARK: Where to stand

    private var standHereCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("WHERE TO STAND")
                .sectionLabelStyle()

            if let coordinate = shots.first?.coordinate ?? store.place(placeID)?.coordinate {
                Map(initialPosition: .region(MKCoordinateRegion(
                    center: coordinate,
                    span: MKCoordinateSpan(latitudeDelta: 0.0035, longitudeDelta: 0.0035)
                )), interactionModes: []) {
                    Annotation("", coordinate: coordinate, anchor: .center) {
                        Circle()
                            .fill(Palette.amber)
                            .frame(width: 18, height: 18)
                            .overlay { Circle().strokeBorder(.white, lineWidth: 3) }
                    }
                }
                .mapStyle(.standard(pointsOfInterest: .excludingAll))
                .annotationTitles(.hidden)
                .frame(height: 104)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .padding(.top, 9)

                Button {
                    MapLinks.open(MapLinks.apple(name: shots.first?.title ?? placeName, coordinate: coordinate))
                } label: {
                    Text("Navigate to spot")
                        .font(.system(size: 12.5, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 42)
                        .background(Palette.ink, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
                .padding(.top, 11)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardSurface()
    }
}

private struct ShotCard: View {
    let shot: MustSeeShot
    let onToggle: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            PhotoPlaceholder(label: "example photo", radius: 0)
                .frame(height: 172)
                .overlay(alignment: .topTrailing) {
                    Button(action: onToggle) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(shot.captured ? .white : Palette.faint)
                            .frame(width: 32, height: 32)
                            .background(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .fill(shot.captured ? Palette.jade : Color.white.opacity(0.9))
                            )
                            .overlay {
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .strokeBorder(shot.captured ? Palette.jade : .white, lineWidth: 1.6)
                            }
                    }
                    .buttonStyle(.plain)
                    .padding(10)
                }

            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(shot.title)
                        .font(.system(size: 14.5, weight: .bold))
                    Spacer(minLength: 0)
                    Text(shot.tag)
                        .font(.system(size: 10.5, weight: .heavy))
                        .foregroundStyle(Palette.soft)
                }
                Text(shot.summary)
                    .font(.system(size: 12.5))
                    .lineSpacing(2)
                    .foregroundStyle(Palette.charcoal)
                    .padding(.top, 5)
                HStack(spacing: 7) {
                    Image(systemName: "mappin")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(Palette.soft)
                    Text(shot.whereToFind)
                        .font(.system(size: 11.5, weight: .semibold))
                        .foregroundStyle(Palette.muted)
                }
                .padding(.top, 9)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .cardSurface()
    }
}

extension String {
    var capitalizedFirst: String {
        guard let first else { return self }
        return first.uppercased() + dropFirst()
    }
}
