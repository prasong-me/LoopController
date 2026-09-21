# Architecture

LoopControllerApp -> LoopController -> Profile Engine + VPN Manager + Routing -> NETunnelProviderManager -> LoopControllerPacketTunnel.

Future engines: Loopback, DNS, Security/Blocklist, Proxy, Packet Forwarding/NAT and Automation.

## Design rules
1. One logical Packet Tunnel configuration.
2. Profiles are data, not separate VPN applications.
3. Pass the selected profile through providerConfiguration.
4. Keep packet processing independent from SwiftUI.
5. Verify networking features on a physical device before declaring them functional.
6. Retain required third-party licenses and attribution.