import SwiftUI

/// Colour tokens lifted from the Claude Design prototype (`Screen.dc.html`).
/// Jade = the agent's main route, amber = anything the traveller planned themselves.
enum Palette {
    static let ink = Color(hex: 0x14201C)
    static let jade = Color(hex: 0x1F6F5C)
    static let amber = Color(hex: 0xC87F0A)

    static let bone = Color(hex: 0xF2F3F1)
    static let card = Color.white
    static let charcoal = Color(hex: 0x3D4C46)
    static let muted = Color(hex: 0x6B7A74)
    static let soft = Color(hex: 0x98A5A0)
    static let faint = Color(hex: 0xB4BEB9)
    static let strike = Color(hex: 0x9AA6A1)

    static let hairline = Color(hex: 0xF0F2F0)
    static let rule = Color(hex: 0xEDEFEC)
    static let border = Color(hex: 0xE7EAE7)
    static let field = Color(hex: 0xE1E5E1)
    static let timeline = Color(hex: 0xDCE2DE)
    static let checkbox = Color(hex: 0xD2D8D3)
    static let dashed = Color(hex: 0xC9D0CB)

    static let jadeSoft = Color(hex: 0xE6EFEB)
    static let jadeSoftBorder = Color(hex: 0xCFE0D9)
    static let jadeDim = Color(hex: 0x5D8C7C)

    static let amberSoft = Color(hex: 0xFBF1DE)
    static let amberSoftBorder = Color(hex: 0xEBD9B4)
    static let amberInk = Color(hex: 0x8A5A08)
    static let amberDashed = Color(hex: 0xE3CFA3)
    static let amberCardBg = Color(hex: 0xFFFDF7)

    static let dangerSoft = Color(hex: 0xF8E9E9)
    static let danger = Color(hex: 0x9B4B4B)

    static let archiveCard = Color(hex: 0x3D4C46)
    static let archiveTitle = Color(hex: 0xE4EBE8)
    static let archiveBody = Color(hex: 0x9FB2AA)
    static let archiveAccent = Color(hex: 0xA8CFC0)

    static let onDarkLabel = Color(hex: 0x8FB3A6)
    static let onDarkBody = Color(hex: 0xC8D6D0)

    static let tabIdle = Color(hex: 0x9AA6A1)

    /// Placeholder hatch used wherever the prototype had a stand-in image.
    static let hatchLight = Color(hex: 0xE2E6E2)
    static let hatchDark = Color(hex: 0xDADFDA)

    // Map styling
    static let mapRoute = jade
    static let mapSubRoute = amber
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }
}

/// The prototype used Public Sans at fractional weights (550/650). The system
/// font is the closest native equivalent; weights are mapped to the nearest.
enum Typo {
    static func screenTitle() -> Font { .system(size: 24, weight: .bold) }
    static func sheetTitle() -> Font { .system(size: 20, weight: .bold) }
    static func pushTitle() -> Font { .system(size: 17, weight: .bold) }
    static func cardTitle() -> Font { .system(size: 14.5, weight: .semibold) }
    static func rowTitle() -> Font { .system(size: 13.5, weight: .semibold) }
    static func body() -> Font { .system(size: 13, weight: .regular) }
    static func meta() -> Font { .system(size: 11.5, weight: .regular) }
    static func chip() -> Font { .system(size: 11, weight: .bold) }
    static func tag() -> Font { .system(size: 9.5, weight: .heavy) }

    /// Small all-caps section label, e.g. "ACTUAL SPEND".
    static func sectionLabel() -> Font { .system(size: 10.5, weight: .heavy) }
}

extension View {
    /// Uppercase tracked label used above most groups in the design.
    func sectionLabelStyle(_ color: Color = Palette.soft) -> some View {
        self.font(Typo.sectionLabel())
            .tracking(0.6)
            .foregroundStyle(color)
    }

    func cardSurface(radius: CGFloat = 16) -> some View {
        self.background(Palette.card, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
    }
}

/// Diagonal hatch that stands in for photography the real app will load from
/// Firebase Storage or a place API.
struct PhotoPlaceholder: View {
    var label: String?
    var radius: CGFloat = 11

    var body: some View {
        ZStack {
            Palette.hatchLight
            GeometryReader { geo in
                let step: CGFloat = 14
                let span = geo.size.width + geo.size.height
                Path { path in
                    var x = -geo.size.height
                    while x < span {
                        path.move(to: CGPoint(x: x, y: 0))
                        path.addLine(to: CGPoint(x: x + geo.size.height, y: geo.size.height))
                        x += step
                    }
                }
                .stroke(Palette.hatchDark, lineWidth: 7)
            }
            if let label {
                Text(label)
                    .font(.system(size: 10.5, weight: .bold))
                    .foregroundStyle(Color(hex: 0x8B968F))
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
    }
}
