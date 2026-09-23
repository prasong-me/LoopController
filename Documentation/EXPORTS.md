# Configuration Compiler and External Targets

LoopController is being redesigned from a small set of exporters into a **configuration compiler**.

## Core idea

The app owns one neutral configuration model. Target applications receive generated configurations through adapters.

```text
Profile
  ↓
Canonical Policy
  ↓
Capability Check
  ↓
Target Compiler
  ↓
Target Serializer
  ↓
.conf / .yaml / .json / .toml / other text config
```

The target file is therefore an output artifact, not the source of truth.

## Supported target families

### Surge

Surge uses an INI-like profile format with sections including `[General]`, `[Proxy]`, `[Proxy Group]`, and `[Rule]`. Surge also has dedicated VIF route controls such as `tun-included-routes` and `tun-excluded-routes`. The adapter must therefore distinguish network-route semantics from traffic-rule semantics. citeturn823730search0turn823730search1

### Mihomo / Clash family

The Mihomo configuration model is YAML-based and includes routing, proxies, proxy groups, DNS, and rule providers. Rocket Proxy is handled as a target runtime for the supported Clash/Stash/Mihomo-style configuration rather than as a separate canonical model. citeturn823730search3turn823730search4

## Semantic mapping

The compiler must keep these concepts separate:

| Canonical concept | Example target representation |
|---|---|
| Route | Surge VIF route / target route mechanism |
| Traffic Rule | Surge `[Rule]` / Mihomo `rules` |
| Proxy | Surge `[Proxy]` / Mihomo `proxies` |
| Proxy Group | Surge `[Proxy Group]` / Mihomo `proxy-groups` |
| DNS | Surge `[General]` / Mihomo `dns` |
| Rule Provider | Surge ruleset mechanisms / Mihomo `rule-providers` |
| Loopback | Target-specific takeover/interception mechanism or native engine |
| Blocking | Provider-backed rulesets or native blocking engine |

A canonical feature must not be mapped merely because two target files happen to accept similar text.

## Lossy conversion policy

Each export produces:

- generated configuration
- target name/version
- supported feature set
- warnings
- errors
- omitted/approximated features
- validation status

Example:

```text
Requested:
  loopback = true

Target:
  Surge

Result:
  status = warning
  reason = target configuration does not equal LoopController's native
           packet-forwarding/NAT implementation
```

The compiler must never mark such an export as equivalent when it is only syntactically valid.

## Serialization

Serialization is a reusable layer, independent of network features.

Initial format families:

- JSON
- YAML
- INI/CONF
- TOML
- XML/plist when a target needs them
- line-oriented and template-defined configuration

“รองรับหลายภาษา” in this project means that new configuration syntaxes can be added through serializers/adapters without changing the canonical network model. It does not mean every arbitrary file format is automatically semantically compatible.

## Import

Where a target format is sufficiently documented and reversible, LoopController should support:

```text
Target Config → Parser → Canonical Policy → Compiler → Target Config
```

Target-specific extensions that cannot be represented neutrally should be preserved as extensions or surfaced as non-portable data.

## External app policy

LoopController does not start, stop, or silently control third-party VPN runtimes. During development they are validation targets.

Current reference roles:

- Surge — profile/routing behavior reference
- Rocket Proxy — Clash-family YAML import reference
- ProxyPin — HTTP(S) traffic inspection
- Control D — DNS testing
- WireGuard — L3 tunnel testing

Only one VPN/tunnel runtime should be used for system traffic at a time during testing.
