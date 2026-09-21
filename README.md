# LoopController

An iOS Network Extension controller built around one Packet Tunnel and data-driven profiles.

## Profiles
- SideStore — loopback route foundation; DNS/blocking/full tunnel disabled.
- Privacy — secure DNS and filtering configuration.
- Family — malware, phishing, tracker, adult and gambling filtering configuration.
- Custom — user-configurable networking profile.

## Current status
Phase 1 controller foundation. The Packet Tunnel configures virtual networking and routes, but packet forwarding/NAT, real loopback forwarding, DNS interception and blocklist enforcement are not implemented yet.

Do not treat this as a production VPN or confirmed SideStore compatibility until physical-device testing with the required Apple Network Extension entitlement.

## Requirements
- Xcode with a suitable iOS SDK
- Apple Developer signing/team
- Network Extension capability/entitlement
- App and Packet Tunnel extension targets

The Packet Tunnel bundle identifier in VPNManager.swift is a placeholder and must match the extension target in Xcode.

See Documentation/ for architecture, roadmap, limitations and credits.

License: MIT.