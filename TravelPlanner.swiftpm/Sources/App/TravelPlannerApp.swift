import SwiftUI

@main
struct TravelPlannerApp: App {
    @StateObject private var bootstrap = FirebaseBootstrap()
    @StateObject private var store = TripStore()
    @StateObject private var router = AppRouter()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(bootstrap)
                .environmentObject(store)
                .environmentObject(router)
                .task {
                    await bootstrap.start()
                    if case let .ready(uid) = bootstrap.phase {
                        await store.attach(uid: uid)
                    }
                }
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var bootstrap: FirebaseBootstrap
    @EnvironmentObject private var store: TripStore

    var body: some View {
        switch bootstrap.phase {
        case .starting:
            LoadingScreen(message: "Opening your trip…")
        case .failed(let reason):
            FailureScreen(reason: reason) {
                Task {
                    await bootstrap.start()
                    if case let .ready(uid) = bootstrap.phase {
                        await store.attach(uid: uid)
                    }
                }
            }
        case .ready:
            if store.trip == nil {
                LoadingScreen(message: "Loading Meridian City…")
            } else {
                RootTabView()
            }
        }
    }
}

struct LoadingScreen: View {
    let message: String

    var body: some View {
        VStack(spacing: 14) {
            ProgressView()
                .tint(Palette.jade)
            Text(message)
                .font(Typo.meta())
                .foregroundStyle(Palette.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Palette.bone)
    }
}

struct FailureScreen: View {
    let reason: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Text("Could not reach your trip")
                .font(Typo.sheetTitle())
            Text(reason)
                .font(Typo.meta())
                .foregroundStyle(Palette.muted)
                .multilineTextAlignment(.center)
            Button("Try again", action: retry)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(.white)
                .padding(.horizontal, 18)
                .frame(height: 42)
                .background(Palette.jade, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .padding(28)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Palette.bone)
    }
}
