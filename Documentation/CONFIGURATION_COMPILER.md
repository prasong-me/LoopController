# Configuration Compiler Design

## Goal

Build LoopController as a **universal configuration intermediary** for networking.

The system receives a target-independent policy and produces the configuration required by a selected application or runtime.

## Core data flow

```text
Input
  ├── LoopController profile
  ├── imported Surge config
  ├── imported Mihomo/Clash YAML
  └── future inputs

        ↓

Canonical Policy

        ↓

Capability Planner
  ├── supported
  ├── transformable
  ├── lossy
  └── unsupported

        ↓

Compiled Target Model

        ↓

Serializer

        ↓

Output
  ├── .conf
  ├── .yaml
  ├── .json
  ├── .toml
  └── custom text
```

## Canonical model

The canonical policy should eventually contain these independent domains:

### Network

- interface/tunnel definition
- IPv4
- IPv6
- MTU
- route tables
- excluded/included routes

### Matching

- domain
- IP/CIDR
- protocol
- source/destination
- ports
- process/app identifiers where a target supports them
- logical conditions

### Outbound

- DIRECT
- REJECT
- proxy nodes
- proxy groups
- WireGuard/tunnel endpoints
- target-specific outbound extensions

### DNS

- upstream servers
- encrypted DNS
- per-domain policies
- local mappings
- fake-IP or equivalent behavior
- IPv4/IPv6 answer policy

### Security

- allowlists
- blocklists
- category providers
- rule providers
- action on match

### Interception

- loopback
- transparent takeover
- local listeners
- port forwarding
- native packet interception requirements

### Automation

- schedule
- network condition
- profile switching
- external automation hooks

## Compiler contract

Every adapter should implement the same conceptual contract:

```text
compile(policy, targetCapabilities)
    -> compiledConfiguration
    -> diagnostics
```

Diagnostics must distinguish:

- error: cannot generate a valid target configuration
- warning: configuration is valid but behavior differs or a feature is lossy
- info: a feature was normalized or transformed
- unsupported: target has no equivalent
- omitted: user explicitly allowed omission

## Strictness levels

The UI should eventually expose:

### Strict
Any unsupported or lossy feature stops export.

### Safe
Unsupported features stop export; lossy transformations require confirmation.

### Best effort
Generate the closest supported target configuration and show all differences.

The default should be Safe.

## Versioning

Targets and capability definitions must be versioned separately from the canonical model.

Example:

```text
target = surge
capabilities = 1
profileDialect = current

target = mihomo
capabilities = 1
profileDialect = current
```

This allows the compiler to evolve when a target adds, removes or changes a configuration feature.

## Testing strategy

Each adapter gets:

1. syntax tests
2. golden-file tests
3. semantic mapping tests
4. negative tests for unsupported features
5. round-trip import/export tests where possible
6. target import validation
7. physical networking tests for runtime behavior

## Security and licensing

The project should generate configuration syntax from documented behavior rather than copy proprietary application source.

External rule providers, blocklists, certificates, scripts and other third-party resources must be treated as explicit dependencies with their own license/attribution requirements.
