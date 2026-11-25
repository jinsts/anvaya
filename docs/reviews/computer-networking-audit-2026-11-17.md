---
title: Computer Networking audit against the subject standard
status: draft
drafter: agent
auditDate: 2026-11-17
auditedCommit: 6d48b46
scope: curriculum only
standard: docs/SUBJECT_STANDARD.md
---

# Computer Networking audit

## Verdict

The twelve planned topics follow the stack from links to applications and
end with diagnosis. That is the right order, and it covers the "what happens
when you enter a URL" deep dive. Two problems block drafting:

- Transport and HTTP each hide three or more teaching units.
- TLS, load balancing and connection management have no settled owner. They
  overlap the security, distributed systems and operating systems outlines.

Packet-level evidence, the subject's most valuable experiment, needs
privileges this environment lacks, so the evidence plan has to be decided up
front. **P0 0, P1 2, P2 3, P3 1.**

## What is present

From `pnpm subject:report computer-networking`: one path section, 12 planned
topics, no lessons, labs or problems, and an overview with all keys including a
7-chapter sketch. The report raised no flags.

## Scores

L, V, E, P and W are n/a: there are no lessons.

| Group | ID          | Score   | Evidence or exceptions                                                                                                 |
| ----- | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| C     | C1          | partial | Core stack and web protocols covered; CDNs, WebSockets/gRPC streaming and latency arithmetic have no topic (F3).       |
| C     | C2          | partial | Boundaries with security (TLS, cryptography), distributed systems (load balancing) and OS (sockets) are unstated (F2). |
| C     | C3          | pass    | The prerequisite `operating-systems-runtime-internals` comes first in the path; topics run bottom-up.                  |
| C     | C4          | fail    | TCP/UDP, HTTP versions, and routing/NAT/firewalls are several units each (F1).                                         |
| C     | C5          | partial | No exact duplicate title; overlapping scope with three other subjects (F2).                                            |
| C     | C6          | fail    | No running thread proposed (F6).                                                                                       |
| C     | C7          | partial | Overview mentions IPv6 neighbour discovery and CDNs; no topic owns them (F3).                                          |
| C     | C8          | pass    | One section; the sketch agrees with the planned list.                                                                  |
| —     | Feasibility | partial | Socket labs fit the gate; packet capture and `tc netem` need privileges (F4); sources need registering (F5).           |

## Findings

### F1 · P1. Transport and HTTP need several pages each (C4)

| Planned title (path line)                                                                  | Likely pages                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| [TCP and UDP internals](../../src/content/paths/engineering-fundamentals.yaml#L118)        | handshake and state machine; reliability and retransmission; flow control; congestion control; UDP and when it fits |
| [HTTP/1.1, HTTP/2, and HTTP/3](../../src/content/paths/engineering-fundamentals.yaml#L121) | HTTP semantics and HTTP/1.1 connections; HTTP/2 multiplexing and head-of-line blocking; QUIC and HTTP/3             |
| [Routing, NAT, and firewalls](../../src/content/paths/engineering-fundamentals.yaml#L117)  | longest-prefix routing; NAT and connection tracking; stateful firewalls and security groups                         |
| [TLS and secure communication](../../src/content/paths/engineering-fundamentals.yaml#L122) | the TLS 1.3 handshake; certificates and chain validation                                                            |

That gives about 22–26 pages. **Fix:** split these in a create-subject proposal.

### F2 · P1. Shared topics need one owner each (C2, C5)

- **TLS:** networking's "TLS and secure communication" against security's
  "Cryptography fundamentals and practical applications". Proposed split:
  networking owns the handshake, certificates and session resumption on the
  wire; security owns the primitives (hashing, MACs, AEAD, key exchange) and
  key management. Each links to the other.
- **Load balancing:** "Reverse proxies, gateways, and load balancing" against
  distributed systems' "Scalability and architectural trade-offs". Proposed:
  networking owns L4/L7 mechanics, health checks and draining; distributed
  systems owns load-distribution strategy as a scaling decision.
- **Sockets:** "Sockets and network programming" against the OS subject's
  "System calls and I/O". Proposed: the OS subject owns readiness and
  completion APIs (`epoll`, `io_uring`); networking owns socket semantics
  (partial reads, backlog, `SO_REUSEADDR`, half-close, timeouts).
- **Performance:** "Connection management and network performance" against
  security-performance-reliability's latency topics. Proposed: networking owns
  round trips, bandwidth-delay product and keep-alive; SPR owns load testing and
  capacity.

**Fix:** record these boundaries in the proposal and in path comments.

### F3 · P2. Topics the overview promises but no title covers (C1, C7)

CDNs and edge caching, WebSockets and gRPC streaming (both in the overview's
architecture list), IPv6 and neighbour discovery (in its mechanisms), and the
latency arithmetic of round trips, bandwidth and the bandwidth-delay product.
**Fix:** add pages, fold them into the split pages above, or exclude them
explicitly.

### F4 · P2. Packet evidence needs an owner-run plan (E3, E6)

`tcpdump`, `tshark` and `dig` are not installed. Capturing packets needs
`CAP_NET_RAW`, and `tc netem` needs root, which this environment does not use.
`ss`, `ip`, `curl` and `openssl` are present, and Node.js can open TCP and UDP
sockets on loopback inside the gate. **Fix:** labs and in-gate evidence use
loopback sockets and TypeScript models (TCP state machine, sliding window,
congestion window, longest-prefix match, NAT table). Captures and impaired-link
runs become owner-run scripts with tested refusal paths. Recorded `.pcap`
summaries are drift-checked only when the owner records them. Lessons never
depend on live internet access.

### F5 · P2. Sources to register (E8)

`rfc-editor` covers TCP, HTTP, QUIC, TLS and DNS specifications, `man7` covers
`tcp(7)` and `socket(7)`, and `mdn` covers HTTP. No explanatory text is
registered. **Fix:** candidates to open and register: _Computer Networks: A
Systems Approach_ (book.systemsapproach.org, free online), _High Performance
Browser Networking_ (hpbn.co, free online) and the Wireshark user guide. None
was opened for this audit.

### F6 · P3. No running thread (C6)

One HTTPS request followed through every chapter (DNS, TCP, TLS, HTTP/2, a
proxy, a capture) would mirror the architecture subject's reused programs.
**Fix:** propose it in the outline.

## Factual errors

None found. The overview was read for consistency with the planned topics, not
checked against external sources.

## Report flags that are not findings

None raised.

## Standard feedback

None beyond the C8 note in the operating systems audit.

## Recommended sequence

1. Settle F2's boundaries together with the security and distributed systems
   outlines. They are one decision across three subjects.
2. Run create-subject: split F1's titles, add or exclude F3, and plan the
   loopback-and-owner-run evidence of F4.
3. One planning change, then lesson-by-lesson drafting.

## Verification performed

On 2026-11-17 at `6d48b46`: `pnpm subject:report computer-networking` (no
flags); read the subject YAML and the path sections of this subject and its
neighbours; checked tool availability with `command -v`. No external source
was opened for this audit.
