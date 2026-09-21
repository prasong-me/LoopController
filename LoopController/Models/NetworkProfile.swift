import Foundation

struct NetworkProfile: Codable, Identifiable, Hashable {
    enum Kind: String, Codable, Hashable {
        case sideStore
        case privacy
        case family
        case custom
    }

    struct Loopback: Codable, Hashable {
        var enabled: Bool
        var address: String
        var prefixLength: Int
    }

    struct DNS: Codable, Hashable {
        var enabled: Bool
        var servers: [String]
        var searchDomains: [String]
    }

    struct Blocking: Codable, Hashable {
        var enabled: Bool
        var malware: Bool
        var phishing: Bool
        var tracker: Bool
        var adult: Bool
        var gambling: Bool
    }

    struct Route: Codable, Hashable {
        var destination: String
        var prefixLength: Int
    }

    var id: UUID
    var name: String
    var kind: Kind
    var loopback: Loopback
    var dns: DNS
    var blocking: Blocking
    var fullTunnel: Bool
    var routes: [Route]
    var mtu: Int

    init(
        id: UUID = UUID(),
        name: String,
        kind: Kind,
        loopback: Loopback,
        dns: DNS,
        blocking: Blocking,
        fullTunnel: Bool,
        routes: [Route],
        mtu: Int
    ) {
        self.id = id
        self.name = name
        self.kind = kind
        self.loopback = loopback
        self.dns = dns
        self.blocking = blocking
        self.fullTunnel = fullTunnel
        self.routes = routes
        self.mtu = mtu
    }

    static let sideStore = NetworkProfile(
        name: "SideStore",
        kind: .sideStore,
        loopback: .init(enabled: true, address: "10.7.0.1", prefixLength: 32),
        dns: .init(enabled: false, servers: [], searchDomains: []),
        blocking: .init(enabled: false, malware: false, phishing: false, tracker: false, adult: false, gambling: false),
        fullTunnel: false,
        routes: [.init(destination: "10.7.0.1", prefixLength: 32)],
        mtu: 1500
    )

    static let privacy = NetworkProfile(
        name: "Privacy",
        kind: .privacy,
        loopback: .init(enabled: false, address: "10.7.0.1", prefixLength: 32),
        dns: .init(enabled: true, servers: ["1.1.1.1", "1.0.0.1"], searchDomains: []),
        blocking: .init(enabled: true, malware: true, phishing: true, tracker: true, adult: false, gambling: false),
        fullTunnel: false,
        routes: [],
        mtu: 1500
    )

    static let family = NetworkProfile(
        name: "Family",
        kind: .family,
        loopback: .init(enabled: false, address: "10.7.0.1", prefixLength: 32),
        dns: .init(enabled: true, servers: ["1.1.1.1", "1.0.0.1"], searchDomains: []),
        blocking: .init(enabled: true, malware: true, phishing: true, tracker: true, adult: true, gambling: true),
        fullTunnel: false,
        routes: [],
        mtu: 1500
    )

    static let custom = NetworkProfile(
        name: "Custom",
        kind: .custom,
        loopback: .init(enabled: true, address: "10.7.0.1", prefixLength: 32),
        dns: .init(enabled: false, servers: [], searchDomains: []),
        blocking: .init(enabled: false, malware: false, phishing: false, tracker: false, adult: false, gambling: false),
        fullTunnel: false,
        routes: [],
        mtu: 1500
    )
}
