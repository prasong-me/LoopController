import Foundation
import Combine

@MainActor
final class LoopController: ObservableObject {
    @Published private(set) var selectedProfile: NetworkProfile
    @Published private(set) var profiles: [NetworkProfile]
    let vpnManager: VPNManager

    init() {
        profiles = [.sideStore, .privacy, .family, .custom]
        selectedProfile = .sideStore
        vpnManager = VPNManager()
    }

    func select(_ profile: NetworkProfile) {
        selectedProfile = profile
    }

    func startSelectedProfile() async throws {
        try await vpnManager.start(profile: selectedProfile)
    }

    func stop() async throws {
        try await vpnManager.stop()
    }
}
