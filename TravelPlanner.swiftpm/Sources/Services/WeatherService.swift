import Foundation

/// Daily forecast for the trip's city, used on the day pills, the Plan banner,
/// the Prep forecast strip and the outfit advice.
///
/// Open-Meteo needs no API key or entitlement, which keeps the app buildable
/// straight out of the box. Swap in WeatherKit if you want Apple's data: the
/// only thing that has to come back is `[DayWeather]`.
struct WeatherService {

    /// Open-Meteo forecasts about 16 days out; beyond that the trip keeps
    /// whatever figures it already has.
    static let forecastHorizonDays = 16

    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func forecast(latitude: Double, longitude: Double, startDate: Date, days: Int) async throws -> [DayWeather] {
        guard days > 0 else { return [] }
        guard let endDate = Calendar.current.date(byAdding: .day, value: days - 1, to: startDate) else { return [] }

        var components = URLComponents(string: "https://api.open-meteo.com/v1/forecast")
        components?.queryItems = [
            URLQueryItem(name: "latitude", value: String(latitude)),
            URLQueryItem(name: "longitude", value: String(longitude)),
            URLQueryItem(name: "daily", value: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"),
            URLQueryItem(name: "timezone", value: "auto"),
            URLQueryItem(name: "start_date", value: Self.apiDate.string(from: startDate)),
            URLQueryItem(name: "end_date", value: Self.apiDate.string(from: endDate))
        ]
        guard let url = components?.url else { return [] }

        let (data, _) = try await session.data(from: url)
        let payload = try JSONDecoder().decode(Payload.self, from: data)
        return payload.daily.asDayWeather()
    }

    /// True when the trip is close enough for a forecast to exist.
    static func isWithinHorizon(startDate: Date, days: Int) -> Bool {
        let calendar = Calendar.current
        guard let lastDay = calendar.date(byAdding: .day, value: days - 1, to: startDate) else { return false }
        guard let horizon = calendar.date(byAdding: .day, value: forecastHorizonDays, to: Date()) else { return false }
        return lastDay >= calendar.startOfDay(for: Date()) && startDate <= horizon
    }

    private static let apiDate: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "UTC")
        return f
    }()

    // MARK: Decoding

    private struct Payload: Decodable {
        let daily: Daily
    }

    private struct Daily: Decodable {
        let time: [String]
        let weatherCode: [Int]
        let temperatureMax: [Double]
        let temperatureMin: [Double]
        let precipitationProbabilityMax: [Int?]

        enum CodingKeys: String, CodingKey {
            case time
            case weatherCode = "weather_code"
            case temperatureMax = "temperature_2m_max"
            case temperatureMin = "temperature_2m_min"
            case precipitationProbabilityMax = "precipitation_probability_max"
        }

        func asDayWeather() -> [DayWeather] {
            time.indices.map { i in
                let code = weatherCode.indices.contains(i) ? weatherCode[i] : 0
                let condition = WMO.condition(for: code)
                return DayWeather(
                    dayNumber: i + 1,
                    icon: condition.icon,
                    high: Int(temperatureMax.indices.contains(i) ? temperatureMax[i].rounded() : 0),
                    low: Int(temperatureMin.indices.contains(i) ? temperatureMin[i].rounded() : 0),
                    rainChance: precipitationProbabilityMax.indices.contains(i) ? (precipitationProbabilityMax[i] ?? 0) : 0,
                    summary: condition.summary
                )
            }
        }
    }
}

/// WMO weather codes → the glyph-and-word pairs the design uses.
enum WMO {
    struct Condition {
        let icon: String
        let summary: String
    }

    static func condition(for code: Int) -> Condition {
        switch code {
        case 0: return Condition(icon: "☀", summary: "clear")
        case 1, 2: return Condition(icon: "⛅", summary: "partly cloudy")
        case 3: return Condition(icon: "☁", summary: "overcast")
        case 45, 48: return Condition(icon: "🌫", summary: "fog")
        case 51, 53, 55, 56, 57: return Condition(icon: "🌦", summary: "drizzle")
        case 61, 63, 65, 66, 67, 80, 81, 82: return Condition(icon: "🌧", summary: "rain")
        case 71, 73, 75, 77, 85, 86: return Condition(icon: "🌨", summary: "snow")
        case 95, 96, 99: return Condition(icon: "⛈", summary: "thunderstorms")
        default: return Condition(icon: "☁", summary: "cloudy")
        }
    }
}

/// Turns the day's forecast into the wardrobe advice on the must-see screen.
/// The prototype's copy was hand-written for 16 °C and overcast; this derives
/// the same shape of sentence from whatever the forecast actually says.
enum OutfitAdvice {

    static func text(for weather: DayWeather?, placeName: String) -> String {
        guard let weather else {
            return "No forecast for this day yet. Layer up and keep a compact rain shell in the bag."
        }

        let layer: String
        switch weather.high {
        case ..<8: layer = "a proper winter coat over two layers"
        case 8..<14: layer = "a warm coat and a knit underneath"
        case 14..<20: layer = "a mid-weight layer"
        case 20..<27: layer = "one light layer you can take off"
        default: layer = "the lightest thing you own, plus shade for your head"
        }

        var lines = ["\(weather.high) °C and \(weather.summary) on this day, so \(layer) works."]
        lines.append("\(placeName) photographs best against one solid warm tone — rust, cream or mustard.")

        if weather.rainChance >= 50 {
            lines.append("\(weather.rainLabel) chance of rain: waterproof shoes and a folding umbrella.")
        } else {
            lines.append("Flat shoes — you will be standing and walking more than you think.")
        }

        if weather.low <= weather.high - 4 {
            lines.append("Down to \(weather.low) °C after dark, so bring a layer you can add.")
        }

        return lines.joined(separator: " ")
    }

    static func chips(for weather: DayWeather?) -> [String] {
        guard let weather else { return SeedData.outfitSuggestionChips }
        var chips: [String] = []
        chips.append(weather.high < 14 ? "warm coat" : "rust coat")
        chips.append(weather.high < 18 ? "cream knit" : "cotton shirt")
        chips.append(weather.rainChance >= 50 ? "waterproof shoes" : "flat shoes")
        if weather.rainChance >= 50 { chips.append("folding umbrella") }
        return chips
    }
}
