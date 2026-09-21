import NetworkExtension

final class PacketTunnelProvider: NEPacketTunnelProvider {
    override func startTunnel(
        options: [String: NSObject]?,
        completionHandler: @escaping (Error?) -> Void
    ) {
        guard
            let data = protocolConfiguration.providerConfiguration?["profileJSON"] as? Data,
            let profile = try? JSONDecoder().decode(NetworkProfile.self, from: data)
        else {
            completionHandler(PacketTunnelError.invalidProfile)
            return
        }

        let settings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: "10.7.0.2")
        settings.mtu = NSNumber(value: max(1280, min(profile.mtu, 1500)))

        let ipv4 = NEIPv4Settings(
            addresses: ["10.7.0.2"],
            subnetMasks: ["255.255.255.0"]
        )

        var routes = profile.routes.map {
            NEIPv4Route(
                destinationAddress: $0.destination,
                subnetMask: subnetMask(for: $0.prefixLength)
            )
        }

        if profile.fullTunnel {
            routes.append(
                NEIPv4Route(
                    destinationAddress: "0.0.0.0",
                    subnetMask: "0.0.0.0"
                )
            )
        }

        ipv4.includedRoutes = routes
        settings.ipv4Settings = ipv4

        if profile.dns.enabled && !profile.dns.servers.isEmpty {
            settings.dnsSettings = NEDNSSettings(servers: profile.dns.servers)
        }

        setTunnelNetworkSettings(settings) { [weak self] error in
            guard let self else {
                completionHandler(error)
                return
            }

            guard error == nil else {
                completionHandler(error)
                return
            }

            self.readPackets()
            completionHandler(nil)
        }
    }

    private func readPackets() {
        packetFlow.readPackets { [weak self] _, _ in
            self?.readPackets()
        }
    }

    override func stopTunnel(
        with reason: NEProviderStopReason,
        completionHandler: @escaping () -> Void
    ) {
        completionHandler()
    }

    private func subnetMask(for prefixLength: Int) -> String {
        let prefix = max(0, min(prefixLength, 32))
        if prefix == 0 { return "0.0.0.0" }

        let mask = UInt32.max << UInt32(32 - prefix)
        return "\((mask >> 24) & 255).\((mask >> 16) & 255).\((mask >> 8) & 255).\(mask & 255)"
    }
}

private enum PacketTunnelError: Error {
    case invalidProfile
}
