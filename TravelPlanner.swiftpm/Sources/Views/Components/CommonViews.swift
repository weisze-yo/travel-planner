import SwiftUI
import CoreLocation
import UIKit

/// Small pill used everywhere: category filters, journey legs, log tags.
struct Chip: View {
    let label: String
    var background: Color = Palette.bone
    var foreground: Color = Palette.charcoal
    var border: Color? = nil
    var size: CGFloat = 10.5
    var weight: Font.Weight = .bold

    var body: some View {
        Text(label)
            .font(.system(size: size, weight: weight))
            .foregroundStyle(foreground)
            .lineLimit(1)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(background, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay {
                if let border {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .strokeBorder(border, lineWidth: 1)
                }
            }
    }
}

/// MAIN / SUB / IF TIME / LAST CHANCE.
struct Badge: View {
    let text: String
    var background: Color
    var foreground: Color

    static func main() -> Badge { Badge(text: "MAIN", background: Palette.jadeSoft, foreground: Palette.jade) }
    static func sub() -> Badge { Badge(text: "SUB", background: Palette.amberSoft, foreground: Palette.amberInk) }

    var body: some View {
        Text(text)
            .font(Typo.tag())
            .tracking(0.4)
            .foregroundStyle(foreground)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(background, in: RoundedRectangle(cornerRadius: 6, style: .continuous))
    }
}

struct Checkbox: View {
    let isOn: Bool
    var size: CGFloat = 22

    var body: some View {
        RoundedRectangle(cornerRadius: 7, style: .continuous)
            .fill(isOn ? Palette.jade : Color.white)
            .frame(width: size, height: size)
            .overlay {
                RoundedRectangle(cornerRadius: 7, style: .continuous)
                    .strokeBorder(isOn ? Palette.jade : Palette.checkbox, lineWidth: 1.6)
            }
            .overlay {
                if isOn {
                    Image(systemName: "checkmark")
                        .font(.system(size: size * 0.5, weight: .bold))
                        .foregroundStyle(.white)
                }
            }
    }
}

struct RadioDot: View {
    let isOn: Bool

    var body: some View {
        Circle()
            .fill(isOn ? Palette.jade : Color.white)
            .frame(width: 17, height: 17)
            .overlay {
                Circle().strokeBorder(isOn ? Palette.jade : Palette.checkbox, lineWidth: 1.6)
            }
    }
}

struct ProgressTrack: View {
    /// 0…1
    let value: Double
    var tint: Color = Palette.jade

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Palette.rule)
                Capsule().fill(tint).frame(width: max(0, min(1, value)) * geo.size.width)
            }
        }
        .frame(height: 7)
    }
}

/// The dashed "+ Add …" row that ends most lists.
struct DashedAddButton: View {
    let title: String
    var height: CGFloat = 48
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Palette.charcoal)
                .frame(maxWidth: .infinity)
                .frame(height: height)
                .background {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
                        .foregroundStyle(Palette.dashed)
                }
        }
        .buttonStyle(.plain)
    }
}

struct DragHandle: View {
    var body: some View {
        Image(systemName: "line.3.horizontal")
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(Palette.soft)
    }
}

/// One of the three figures above the sub route: MOVING / AT STOPS / BUFFER.
struct StatTile: View {
    let label: String
    let value: String
    var background: Color = Palette.bone
    var foreground: Color = Palette.ink

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.4)
                .foregroundStyle(foreground == Palette.ink ? Palette.soft : foreground)
            Text(value)
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(foreground)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 11)
        .padding(.vertical, 9)
        .background(background, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

/// Weather line at the top of Plan, in the design's jade-tinted card.
struct WeatherBanner: View {
    let weather: DayWeather?
    let dayNumber: Int
    let source: String

    var body: some View {
        HStack(alignment: .top, spacing: 11) {
            Text(weather?.icon ?? "☁")
                .font(.system(size: 17))
            VStack(alignment: .leading, spacing: 2) {
                Text(line)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Palette.jade)
                    .fixedSize(horizontal: false, vertical: true)
                Text(source)
                    .font(.system(size: 10.5, weight: .medium))
                    .foregroundStyle(Palette.jadeDim)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 11)
        .background(Palette.jadeSoft, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private var line: String {
        guard let weather else { return "No forecast for this day yet." }
        return "Day \(dayNumber): \(weather.summary), \(weather.high) °C, \(weather.rainLabel) rain. \(weather.low) °C by evening."
    }
}

/// Day selector with the day's weather glyph, as on Map and Plan.
struct DayPillRow: View {
    let days: [TripDay]
    let weather: (Int) -> DayWeather?
    @Binding var selected: Int
    var compact = false

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(days) { day in
                    let isOn = day.dayNumber == selected
                    Button {
                        selected = day.dayNumber
                    } label: {
                        HStack(spacing: 5) {
                            Text("D\(day.dayNumber)")
                                .font(.system(size: compact ? 12 : 12.5, weight: .semibold))
                            Text(weather(day.dayNumber)?.icon ?? "")
                                .font(.system(size: compact ? 10.5 : 11))
                                .opacity(0.75)
                        }
                        .foregroundStyle(isOn ? .white : Palette.muted)
                        .padding(.horizontal, compact ? 10 : 12)
                        .frame(height: compact ? 30 : 32)
                        .background(isOn ? Palette.ink : Color.white,
                                    in: RoundedRectangle(cornerRadius: compact ? 9 : 10, style: .continuous))
                        .shadow(color: compact ? .clear : Color.black.opacity(0.06), radius: 3, y: 1)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

struct SheetGrabber: View {
    var body: some View {
        Capsule()
            .fill(Color(hex: 0xD8DDD9))
            .frame(width: 40, height: 4)
    }
}

/// Hands the place off to Google Maps or Apple Maps, per the original brief.
struct MapHandoffButtons: View {
    let name: String
    let coordinate: CLLocationCoordinate2D?

    var body: some View {
        HStack(spacing: 8) {
            Button {
                MapLinks.open(MapLinks.google(name: name, coordinate: coordinate))
            } label: {
                Text("Google Maps")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 46)
                    .background(Palette.ink, in: RoundedRectangle(cornerRadius: 13, style: .continuous))
            }
            .buttonStyle(.plain)

            Button {
                MapLinks.open(MapLinks.apple(name: name, coordinate: coordinate))
            } label: {
                Text("Apple Maps")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Palette.ink)
                    .frame(maxWidth: .infinity)
                    .frame(height: 46)
                    .background(Palette.bone, in: RoundedRectangle(cornerRadius: 13, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 13, style: .continuous)
                            .strokeBorder(Palette.field, lineWidth: 1)
                    }
            }
            .buttonStyle(.plain)
        }
    }
}

enum MapLinks {

    static func google(name: String, coordinate: CLLocationCoordinate2D?) -> URL? {
        var components = URLComponents(string: "https://www.google.com/maps/search/")
        var items = [URLQueryItem(name: "api", value: "1")]
        if let coordinate {
            items.append(URLQueryItem(name: "query", value: "\(coordinate.latitude),\(coordinate.longitude)"))
        } else {
            items.append(URLQueryItem(name: "query", value: name))
        }
        components?.queryItems = items
        return components?.url
    }

    static func apple(name: String, coordinate: CLLocationCoordinate2D?) -> URL? {
        var components = URLComponents(string: "http://maps.apple.com/")
        var items = [URLQueryItem(name: "q", value: name)]
        if let coordinate {
            items.append(URLQueryItem(name: "ll", value: "\(coordinate.latitude),\(coordinate.longitude)"))
        }
        components?.queryItems = items
        return components?.url
    }

    /// Walking directions through every sub-route stop, in order.
    static func walkingRoute(_ coordinates: [CLLocationCoordinate2D]) -> URL? {
        guard coordinates.count >= 2 else { return nil }
        let stringify: (CLLocationCoordinate2D) -> String = { "\($0.latitude),\($0.longitude)" }
        var components = URLComponents(string: "https://www.google.com/maps/dir/")
        var items = [
            URLQueryItem(name: "api", value: "1"),
            URLQueryItem(name: "travelmode", value: "walking"),
            URLQueryItem(name: "origin", value: stringify(coordinates.first!)),
            URLQueryItem(name: "destination", value: stringify(coordinates.last!))
        ]
        let waypoints = coordinates.dropFirst().dropLast()
        if !waypoints.isEmpty {
            items.append(URLQueryItem(name: "waypoints", value: waypoints.map(stringify).joined(separator: "|")))
        }
        components?.queryItems = items
        return components?.url
    }

    static func open(_ url: URL?) {
        guard let url else { return }
        UIApplication.shared.open(url)
    }
}
