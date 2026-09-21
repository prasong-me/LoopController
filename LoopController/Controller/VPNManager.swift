import Foundation
import Combine
import NetworkExtension

@MainActor
final class VPNManager: ObservableObject {
    @Published private(set) var status: NEVPNStatus = .disconnected
    private var manager: NETunnelProviderManager?

    // Replace with the actual Packet Tunnel extension bundle identifier in Xcode.
    private let packetTunnelBundleIdentifier = "Prasong1993.LoopController.PacketTunnel"

    func start(profile: NetworkProfile) async throws {
        let manager = try await loadOrCreateManager()
        let proto = NETunnelProviderProtocol()
        proto.providerBundleIdentifier = packetTunnelBundleIdentifier
        proto.serverAddress = "LoopController"
        proto.providerConfiguration = [
            "profileJSON": try JSONEncoder().encode(profile)
        ]

        manager.protocolConfiguration = proto
        manager.localizedDescription = "LoopController"
        manager.isEnabled = true

        try await manager.saveToPreferences()
        try await manager.loadFromPreferences()
        try manager.connection.startVPNTunnel()

        self.manager = manager
        status = manager.connection.status
    }

    func stop() async throws {
        manager?.connection.stopVPNTunnel()
        status = manager?.connection.status ?? .disconnected
    }

    private func loadOrCreateManager() async throws -> NETunnelProviderManager {
        let managers = try await NETunnelProviderManager.loadAllFromPreferences()
        if let existing = managers.first {
            self.manager = existing
            status = existing.connection.status
            return existing
        }
        return NETunnelProviderManager()
    }
}
