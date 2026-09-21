# OmniLoop Orchestrator

Web configurator for LoopController.

## Phase 1
- HTTP/HTTPS/SOCKS5 proxy settings
- sample AdBlock rules
- SideStore compatibility routing rules
- helper JavaScript
- copy/download generated files

## Important limitation
This web app cannot create an Apple Network Extension, Packet Tunnel, or OS-level UDP loopback. The 127.0.0.1 rule is routing only. Physical testing with a supported proxy app is required before claiming SideStore compatibility.

## Run in Codespaces
```bash
cd omniloop-orchestrator
npm install
npm run dev -- --host 0.0.0.0
```
