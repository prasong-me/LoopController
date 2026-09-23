# Roadmap

LoopController is now planned as a **configuration compiler/orchestrator**, with native networking as one execution target.

## Phase 0 — Architecture reset

- [x] Keep user profiles independent from third-party syntax
- [x] Keep exporters separate from the native Packet Tunnel
- [x] Identify the need for a neutral intermediate model
- [ ] Freeze the first canonical policy schema
- [ ] Define capability and diagnostic contracts
- [ ] Define compatibility/lossiness rules

## Phase 1 — Canonical Configuration Model

- [ ] Create `NetworkPolicy`
- [ ] Split semantic objects into Route, Rule, Proxy, ProxyGroup, DNS, Loopback, Blocking, PortForward and Runtime settings
- [ ] Add IPv4 and IPv6 as first-class values
- [ ] Add protocol/port/domain matching
- [ ] Add explicit proxy/outbound policies
- [ ] Add provider/ruleset references
- [ ] Add target-independent validation

## Phase 2 — Capability Registry and Compiler

- [ ] Create target capability descriptors
- [ ] Create feature support matrix
- [ ] Create compiler pipeline
- [ ] Create warning/error diagnostics
- [ ] Detect lossy conversions
- [ ] Prevent invalid feature combinations
- [ ] Produce an intermediate compiled document before serialization

## Phase 3 — Format and Serialization Engine

- [ ] JSON serializer
- [ ] YAML serializer
- [ ] INI/CONF serializer
- [ ] TOML serializer
- [ ] XML/plist serializer where useful
- [ ] Line-based/custom template serializer
- [ ] Canonical formatting and stable output
- [ ] Round-trip tests

## Phase 4 — Target Adapters

### Surge
- [ ] Correctly map DNS to Surge General settings
- [ ] Map network routes to appropriate Surge VIF route controls where supported
- [ ] Map traffic rules to Surge [Rule]
- [ ] Map proxies and proxy groups
- [ ] Map DNS policies
- [ ] Map supported blocking/ruleset features
- [ ] Add target validation

### Mihomo / Clash-family
- [ ] Generate valid YAML structure
- [ ] Map proxies
- [ ] Map proxy-groups
- [ ] Map rules
- [ ] Map rule-providers / external rule sets
- [ ] Map DNS
- [ ] Map IPv4/IPv6 behavior
- [ ] Add target validation

### Rocket Proxy
- [ ] Treat Rocket Proxy as a target runtime for supported Mihomo/Clash configuration
- [ ] Validate importable YAML against the target's documented feature set
- [ ] Keep Rocket-specific behavior isolated from the canonical model

### Other targets
- [ ] WireGuard
- [ ] Generic JSON
- [ ] Generic YAML
- [ ] Future proxy/VPN applications
- [ ] User-defined templates

## Phase 5 — Import Engine

- [ ] Import JSON/YAML/INI configuration
- [ ] Target-specific parsers
- [ ] Normalize imported configuration into the canonical model
- [ ] Preserve unsupported target extensions
- [ ] Show import warnings
- [ ] Diff imported configuration against the canonical profile

## Phase 6 — Native Network Engines

- [ ] Packet parsing
- [ ] Packet forwarding
- [ ] Connection lifecycle
- [ ] Real loopback forwarding/NAT
- [ ] DNS interception
- [ ] DNS engine
- [ ] Security matcher
- [ ] Blocklist engine
- [ ] Proxy engine
- [ ] Advanced routing
- [ ] IPv6
- [ ] MTU/performance tuning
- [ ] Physical-device testing

## Phase 7 — UI and Automation

- [ ] Configuration editor
- [ ] Target selector
- [ ] Export format selector
- [ ] Capability warnings
- [ ] Preview generated configuration
- [ ] Validation report
- [ ] Import / edit / export workflow
- [ ] Shortcuts/App Intents where supported
- [ ] Profile automation

## Phase 8 — Compatibility Test Suite

For every target:

- [ ] Syntax parser test
- [ ] Required-field test
- [ ] Round-trip test
- [ ] Feature mapping test
- [ ] Unsupported-feature test
- [ ] Golden-file output test
- [ ] Real target import test
- [ ] Physical-device networking test where applicable

## Definition of done

A configuration format is considered supported only when:

1. LoopController can represent its required semantics.
2. The adapter maps those semantics to the target without undocumented assumptions.
3. The generated syntax passes target validation/import.
4. Unsupported features are reported explicitly.
5. The result is covered by automated tests.
6. Networking behavior is verified on a real device when it depends on runtime/network execution.

This roadmap deliberately separates **configuration compatibility** from **network execution compatibility**. A file can be syntactically valid without reproducing the same runtime behavior.
