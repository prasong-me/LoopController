# Limitations

The initial implementation is intentionally a foundation.

It does not currently claim real loopback forwarding, NAT, Internet packet forwarding, DNS interception or rewriting, blocklist enforcement, production full-tunnel behavior, IPv6 support, or SideStore compatibility.

A Packet Tunnel receiving packets from packetFlow is not itself a packet forwarder. Real forwarding requires packet-processing and networking implementation.

Apple Network Extension entitlements, provisioning and physical-device testing are required.