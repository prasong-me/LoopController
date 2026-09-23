# Architecture

## Project role

LoopController is being redesigned as a **configuration intermediary and compiler**.

The app does not treat Surge, Rocket Proxy, WireGuard, or another runtime as the project core. Instead, LoopController owns a neutral networking model and translates that model into the configuration dialect required by each supported target.

```text
                    ┌─────────────────────────────┐
                    │       LoopController        │
                    │ Profile + Capability Model  │
                    └──────────────┬──────────────┘
                                   │
                           Canonical Policy
                                   │
                    ┌──────────────┴──────────────┐
                    │ Configuration Compiler      │
                    │ map / validate / diagnose   │
                    └──────────────┬──────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
      Surge Adapter          Mihomo/Clash Adapter      Future Adapters
          │                        │                        │
        .conf                    .yaml                 .conf/.json/.toml/...
```

The important separation is **meaning first, syntax second**.

## Layers

### 1. User Profile Layer

The user selects a profile such as:

- SideStore
- Privacy
- Family
- Custom

A profile describes desired behavior, not the syntax of any particular app.

### 2. Canonical Network Policy

A new neutral model will represent networking semantics explicitly:

- Interfaces / tunnel
- IPv4 / IPv6
- Routes
- Traffic rules
- Outbound policies
- Proxy nodes
- Proxy groups
- DNS
- DNS policy
- Loopback / interception
- Allowlist / blocklist
- Blocklist providers
- Port forwarding
- MTU
- Time / network conditions
- Automation hooks
- Runtime constraints

This layer must never contain Surge-only or Clash-only field names.

### 3. Capability Registry

Every target gets a capability description.

Examples:

```text
Surge
  syntax: INI-like
  routing: rule-based + VIF route controls
  proxy: yes
  DNS: yes
  MITM: yes
  scripting: yes
  IPv6: yes

Mihomo / Clash-family
  syntax: YAML
  routing: rule-based
  proxy: yes
  proxy-groups: yes
  DNS: yes
  rule-providers: yes
  IPv6: yes
```

The registry is used by the compiler before generating a file.

### 4. Configuration Compiler

The compiler performs four jobs:

1. Normalize the neutral policy.
2. Map each requested feature to target semantics.
3. Detect unsupported or lossy features.
4. Produce a target-specific configuration document.

The compiler must never silently pretend that two different mechanisms are equivalent.

Example:

- A LoopController L3 route is a network route.
- A Surge `[Rule]` entry is a traffic policy rule.

They are not interchangeable. The Surge adapter must map a route to an appropriate Surge route/VIF setting when the target supports that behavior, or report that the requested behavior cannot be represented.

### 5. Serializer Layer

Syntax generation is separate from networking semantics.

Planned serializers include:

- JSON
- YAML
- INI / CONF
- TOML
- XML / plist where useful
- line-oriented formats such as WireGuard-style configuration
- template/custom text formats

Adding a new syntax should not require rewriting the networking model.

### 6. Target Adapter Layer

Each supported application or runtime gets an adapter:

```text
Adapters/
  Surge/
  Mihomo/
  RocketProxy/
  WireGuard/
  LoopController/
  Future/
```

An adapter decides:

- which target fields to emit
- how target-specific syntax is written
- how unsupported features are diagnosed
- how imports are parsed back into the neutral model, where feasible

Rocket Proxy is treated as a **Mihomo/Clash-family target**, not as a separate networking language.

### 7. Validation Layer

Every export goes through validation.

Checks include:

- syntax validity
- required fields
- duplicate definitions
- route/rule conflicts
- rule ordering
- missing proxy references
- invalid addresses
- invalid ports
- unsupported capabilities
- lossy conversion warnings
- target-specific constraints

The export result should contain both the file and diagnostics.

## Import and export

The project is intended to become bidirectional:

```text
Supported Config
      │
      ▼
Target Parser
      │
      ▼
Canonical Policy
      │
      ▼
Target Compiler
      │
      ▼
Another Config Format
```

This allows the app to import an existing configuration, normalize it, edit it, compare it, and export it into another supported dialect.

Importers may be partial. A target-specific feature that has no neutral representation must be preserved as an extension or reported as non-portable rather than discarded silently.

## Native runtime

The iOS Packet Tunnel remains an execution target, not the definition of the whole project.

The native runtime will consume the same canonical policy used by exporters:

```text
Canonical Policy
      ├── Native Packet Tunnel
      ├── Surge exporter
      ├── Mihomo/Clash exporter
      ├── WireGuard exporter
      └── Future targets
```

This prevents the native engine and external exporters from developing separate incompatible configuration models.

## Design rules

1. **Meaning before syntax.**
2. **One canonical policy model.**
3. **Capabilities are explicit.**
4. **Unsupported features generate diagnostics.**
5. **No silent semantic downgrade.**
6. **Target-specific code stays inside adapters.**
7. **Serializers remain reusable.**
8. **Import/export should be as symmetrical as the target format allows.**
9. **Third-party licenses and attribution are retained.**
10. **A generated file is not considered functional until it passes parser/target validation and, for networking features, physical-device testing.**
