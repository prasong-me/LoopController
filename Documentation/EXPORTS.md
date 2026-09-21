# External Runtime Exports

LoopController keeps its networking model independent from third-party apps.

## Export targets

- Surge: generates an INI-like .conf profile.
- Rocket Proxy: generates a Clash/Stash-compatible YAML profile.
- LoopController: generates native JSON for backup and future import/export.

The generated files are configuration adapters, not copied third-party application code.

## Runtime model

Only use one VPN/tunnel runtime for system traffic at a time. During development, an external app can be used as a test runtime while LoopController's native Packet Tunnel is still incomplete.

Suggested validation roles:

1. Surge — routing and rule behavior reference.
2. Rocket Proxy — Clash/Stash YAML compatibility.
3. ProxyPin — HTTP(S) traffic inspection during debugging.
4. Control D — DNS behavior testing.
5. WireGuard — L3 tunnel/routing testing.

LoopController should not attempt to start or control these applications as part of its core VPN manager.

## Limitations

Category flags such as malware, phishing, tracker, adult and gambling do not contain domain lists by themselves. Exporters therefore preserve those flags as comments until LoopController has a defined, licensed blocklist provider/rule-set model.

This avoids silently inventing or embedding third-party lists.

## Surge format

Surge profiles are INI-like and use sections such as [General] and [Rule]. Rules are evaluated in order, so the exporter always places FINAL,DIRECT last.

Source: Surge Profile Format and Rule System documentation:
https://manual.nssurge.com/profile/format.html
https://manual.nssurge.com/rules/overview.html

## Credits

These exporters are original LoopController adapter code. They emit configuration syntax based on the documented configuration formats of the target applications. No proprietary application source code is included.
