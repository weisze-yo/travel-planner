import SwiftUI

enum AppTab: Hashable, CaseIterable {
    case map, plan, shop, prep, log

    var title: String {
        switch self {
        case .map: return "Map"
        case .plan: return "Plan"
        case .shop: return "Shop"
        case .prep: return "Prep"
        case .log: return "Log"
        }
    }

    var symbol: String {
        switch self {
        case .map: return "map"
        case .plan: return "list.bullet"
        case .shop: return "bag"
        case .prep: return "checklist"
        case .log: return "square.and.pencil"
        }
    }
}

/// Lets one screen hand off to another tab — the map's pencil opens Plan in
/// edit mode, and pulling the map sheet up opens Plan.
@MainActor
final class AppRouter: ObservableObject {
    @Published var tab: AppTab = .map
}

/// Pushed screens. Destination, Nearby, the sub route, must-see shots and the
/// note composer always belong to a stop, so they are pushes rather than tabs.
enum Route: Hashable {
    case destination(planItemID: String)
    case placeDetail(placeID: String)
    case nearby(anchorPlaceID: String)
    case subRoute
    case mustSee(placeID: String)
    case note(dayNumber: Int, placeID: String?)
}

struct RootTabView: View {
    @EnvironmentObject private var router: AppRouter

    var body: some View {
        TabView(selection: $router.tab) {
            stack { MapHomeView() }.tag(AppTab.map)
            stack { PlanView() }.tag(AppTab.plan)
            stack { ShopView() }.tag(AppTab.shop)
            stack { PrepView() }.tag(AppTab.prep)
            stack { LogView() }.tag(AppTab.log)
        }
        .overlay(alignment: .bottom) {
            AppTabBar(selection: $router.tab)
        }
        .background(Palette.bone)
    }

    private func stack<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        NavigationStack {
            content()
                .routeDestinations()
        }
        .toolbar(.hidden, for: .tabBar)
    }
}

extension View {
    /// Registers every pushed screen once, so any stack can reach them.
    func routeDestinations() -> some View {
        navigationDestination(for: Route.self) { route in
            switch route {
            case .destination(let planItemID):
                DestinationView(planItemID: planItemID)
            case .placeDetail(let placeID):
                DestinationView(placeID: placeID)
            case .nearby(let anchorPlaceID):
                NearbyView(anchorPlaceID: anchorPlaceID)
            case .subRoute:
                SubRouteView()
            case .mustSee(let placeID):
                MustSeeView(placeID: placeID)
            case .note(let dayNumber, let placeID):
                NoteComposerView(dayNumber: dayNumber, placeID: placeID)
            }
        }
    }
}

struct AppTabBar: View {
    @Binding var selection: AppTab

    var body: some View {
        HStack(spacing: 2) {
            ForEach(AppTab.allCases, id: \.self) { item in
                let isOn = item == selection
                Button {
                    selection = item
                } label: {
                    VStack(spacing: 3) {
                        Image(systemName: item.symbol)
                            .font(.system(size: 15, weight: .semibold))
                        Text(item.title)
                            .font(.system(size: 9.5, weight: .bold))
                    }
                    .foregroundStyle(isOn ? Palette.ink : Palette.tabIdle)
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: 46)
                    .background(isOn ? Palette.bone : .clear,
                                in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 8)
        .padding(.top, 7)
        .background(alignment: .top) {
            ZStack(alignment: .top) {
                Rectangle().fill(.ultraThinMaterial)
                Rectangle().fill(Color.white.opacity(0.55))
                Rectangle().fill(Color(hex: 0xE4E8E5)).frame(height: 1)
            }
            .ignoresSafeArea(edges: .bottom)
        }
    }
}
