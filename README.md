# LoopController

LoopController is an iOS networking project designed as a **configuration intermediary, compiler, and native Network Extension runtime**.

The central idea is:

> Define networking behavior once, then compile it into the configuration language required by a supported target.

## Architecture

```text
User Profile
    ↓
Canonical Network Policy
    ↓
Capability Registry
    ↓
Configuration Compiler
    ↓
Target Adapter
    ↓
JSON / YAML / INI / TOML / other config
    ↓
Target runtime or native Packet Tunnel
```

This keeps the project's networking semantics independent from any single app.

## Current direction

The original project started with four profiles:

- SideStore
- Privacy
- Family
- Custom

Those profiles remain user-facing presets, but they are no longer the long-term configuration model. The project will evolve them into a canonical policy model containing routing, rules, proxy, DNS, loopback, blocking, IPv4/IPv6, ports and runtime settings.

## Important distinction

A configuration can be:

- syntactically valid,
- accepted by an application,
- semantically equivalent,
- or actually functional on a real network.

These are different validation levels.

LoopController will report the difference instead of treating a successful file export as proof that the requested networking behavior works.

## Target formats

The architecture is intended to support many configuration syntaxes through reusable serializers and target adapters, including JSON, YAML, INI/CONF, TOML and target-specific line-oriented formats.

Current named targets:

- Surge
- Mihomo/Clash-family configurations used by Rocket Proxy
- LoopController native JSON
- WireGuard as a future target

Surge profiles use an INI-like format; its profile model includes global settings, proxies, proxy groups and ordered traffic rules. Surge also exposes VIF route controls, so routes and traffic rules must remain separate concepts in the compiler. citeturn823730search0turn823730search1

Mihomo uses YAML configuration with routing, proxies, proxy groups and DNS/rule-provider facilities. citeturn823730search3turn823730search4

## Current implementation status

The existing Packet Tunnel is still a Phase 1 foundation. It configures virtual network settings and routes, but packet forwarding/NAT, true loopback forwarding, DNS interception and blocklist enforcement are not complete.

Do not treat the current native runtime as a production VPN or confirmed SideStore-compatible engine until physical-device testing and the required Apple Network Extension setup are complete.

## Requirements

- Xcode with a suitable iOS SDK
- Apple Developer signing/team
- Network Extension capability/entitlement
- App and Packet Tunnel extension targets

The Packet Tunnel bundle identifier in `VPNManager.swift` is a placeholder and must match the extension target in Xcode.

## Documentation

See `Documentation/` for:

- architecture
- configuration compiler design
- roadmap
- target/export rules
- limitations
- credits

License: MIT.
