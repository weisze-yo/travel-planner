import Foundation
import Combine
import FirebaseCore
import FirebaseAuth
import FirebaseFirestore

/// Brings Firebase up and signs the device in. Anonymous auth gives every
/// install a stable uid to hang data off without putting a login screen in
/// front of the trip; link it to Sign in with Apple later and the same uid
/// carries over.
@MainActor
final class FirebaseBootstrap: ObservableObject {

    enum Phase: Equatable {
        case starting
        case ready(uid: String)
        case failed(String)
    }

    @Published private(set) var phase: Phase = .starting

    func start() async {
        phase = .starting

        if FirebaseApp.app() == nil {
            guard configure() else {
                phase = .failed("""
                No Firebase configuration found.

                Add your GoogleService-Info.plist to Sources/Resources — see \
                GoogleService-Info-SAMPLE.plist in that folder for the steps.
                """)
                return
            }
            enableOnDeviceCache()
        }

        if let user = Auth.auth().currentUser {
            phase = .ready(uid: user.uid)
            return
        }

        do {
            let result = try await Auth.auth().signInAnonymously()
            phase = .ready(uid: result.user.uid)
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    /// Works both here (config is a package resource, so it lands in
    /// `Bundle.module`) and in a normal Xcode project (main bundle).
    private func configure() -> Bool {
        if let path = Bundle.module.path(forResource: "GoogleService-Info", ofType: "plist"),
           let options = FirebaseOptions(contentsOfFile: path) {
            FirebaseApp.configure(options: options)
            return true
        }
        if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
           let options = FirebaseOptions(contentsOfFile: path) {
            FirebaseApp.configure(options: options)
            return true
        }
        return false
    }

    /// Cache the trip on device: free time usually happens without signal.
    private func enableOnDeviceCache() {
        let firestore = Firestore.firestore()
        let settings = firestore.settings
        settings.cacheSettings = PersistentCacheSettings()
        firestore.settings = settings
    }
}
