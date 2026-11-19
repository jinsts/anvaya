---
title: Security, Performance & Reliability audit against the subject standard
status: draft
drafter: agent
auditDate: 2026-11-17
auditedCommit: 6d48b46
scope: curriculum only
standard: docs/SUBJECT_STANDARD.md
---

# Security, Performance & Reliability audit

## Verdict

This is three disciplines in one subject: security engineering (7 topics),
performance engineering (3) and reliability and observability (5). The overview
gives them a shared method of modelling, measuring and containing, but at the
standard's page size the subject would be about 40 pages with little shared
material. Its performance topics overlap the architecture subject's measurement
lesson. Its sources are thin, and the one registered SRE source cannot be cited
at chapter level. Whether to split it is the owner's decision. **P0 0, P1 3,
P2 2, P3 1.**

## What is present

From `pnpm subject:report security-performance-reliability`: one path section,
15 planned topics, no lessons, labs or problems, and an overview with all keys
including a 7-chapter sketch. The report raised no flags.

## Scores

L, V, E, P and W are n/a: there are no lessons.

| Group | ID          | Score   | Evidence or exceptions                                                                                              |
| ----- | ----------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| C     | C1          | partial | Broad and relevant; supply-chain security and rate limiting are mentioned but have no topic (F4).                   |
| C     | C2          | fail    | Three domains with boundaries against networking, distributed systems, OS and architecture unstated (F1, F2).       |
| C     | C3          | pass    | OS and networking precede it in the path.                                                                           |
| C     | C4          | fail    | Several titles are multi-unit, for example authentication and authorization, and cryptography (F1).                 |
| C     | C5          | partial | No exact duplicates; overlaps with architecture measurement, networking TLS and distributed resilience (F2).        |
| C     | C6          | fail    | No running thread proposed (F6).                                                                                    |
| C     | C7          | pass    | Overview claims map onto planned topics.                                                                            |
| C     | C8          | pass    | One section; the sketch agrees with the planned list.                                                               |
| —     | Feasibility | partial | Node's `crypto`, `node:sqlite` and queueing models fit the gate; most sources unregistered; SRE prefix broken (F3). |

## Findings

### F1 · P1. Decide whether this is one subject or three (C2, C4)

At 15–30 minutes a page, the security titles alone need about 18 pages:
threat modelling, authentication (sessions, tokens, OAuth 2.0 and OpenID
Connect), authorization models, cryptography (hashes and MACs, symmetric and
asymmetric, key exchange, password hashing), secrets, and the vulnerability
classes. Performance and reliability need about 20 more. The overview's shared
method can be kept by cross-links either way. **Fix (owner's decision):**

- keep one subject and accept about 40 pages in 7 chapters; or
- split it into "Security engineering" and "Performance & reliability
  engineering". The split is a catalog change that also needs a new subject
  file and path section.

The agent recommends the split. The two halves share few mechanisms, and a
learner can study them in either order.

### F2 · P1. Performance and observability overlap other subjects (C5)

- "Application profiling and performance analysis" and "Latency, throughput, and
  resource utilization" overlap
  [measuring-performance](../../src/content/lessons/computer-architecture-execution/measuring-performance.mdx),
  which already teaches benchmark design, percentiles, the roofline and
  counters. This subject should start from that lesson. Its own material is
  sampling profilers, flame graphs, Little's law, utilization and queueing
  latency, and coordinated omission.
- "Observability and production diagnostics" overlaps the OS subject's "Linux
  fundamentals and diagnostics". Proposed: OS owns per-host tools (`/proc`,
  `vmstat`, `strace`); this subject owns logs, metrics, traces and SLO-driven
  diagnosis across services.
- "Reliability engineering and failure recovery" overlaps distributed systems'
  "Fault tolerance and resilience" (see that audit's F3).
- "Cryptography fundamentals" overlaps networking's TLS (see the networking
  audit's F2).

**Fix:** record each boundary in the proposal and in path comments.

### F3 · P1. The registered SRE source cannot be cited, and others are missing (E8)

`google-sre-books` has the prefix `https://sre.google/books/`, but chapters are
served under `/sre-book/` and `/workbook/`. Both returned HTTP 200, so every SLO
or incident chapter citation would fail the build. **Fix:** add both prefixes.
Other candidates to open and register: OWASP (Top 10 and the cheat sheets),
NIST SP 800-63B (passwords and authenticators), the OpenTelemetry documentation,
and Brendan Gregg's pages on flame graphs and the USE method. `rfc-editor`
already covers OAuth 2.0, JWT and TLS. None of the candidates was opened for
this audit.

### F4 · P2. Supply-chain security and rate limiting have no topic (C1)

The overview lists supply-chain compromise among its vulnerability classes, and
its interview section expects rate limiting without prompting. **Fix:** fold
supply chain into the vulnerability pages or add a page on dependency and build
integrity. Give rate limiting one home, either here or in distributed systems'
load shedding.

### F5 · P2. Security labs need a safe local design (P1 feasibility)

Exploiting a vulnerable application must stay local and deterministic.
Node's built-in `node:sqlite` supports a parameterized and an injectable query
side by side in a lab. Node's `crypto` module supports HMAC, AEAD and `scrypt`
contracts and recorded cost measurements. Queueing labs (Little's law, latency
against utilization, coordinated omission) are pure models. **Fix:** the
proposal names a contract for each page; nothing may reach the network.

### F6 · P3. No running thread (C6)

One small service, threat-modelled, then authenticated, profiled, load-tested,
instrumented and given an SLO, would connect the three halves even if the
subject is split. **Fix:** propose it.

## Factual errors

None found; overview claims were read, not checked against external sources.

## Report flags that are not findings

None raised.

## Standard feedback

- **C4 at subject level:** the standard sizes pages but not subjects. A subject
  of 40 pages may be fine, but the standard could ask the outline to justify
  any subject that has more than about 30 pages or several unrelated
  mechanisms. This is for the owner to decide.

## Recommended sequence

1. Add the `google-sre-books` prefixes.
2. The owner decides F1 (one subject or two).
3. Settle F2's boundaries with the neighbouring outlines.
4. Run create-subject for each resulting subject; one planning change each;
   then drafting.

## Verification performed

On 2026-11-17 at `6d48b46`: `pnpm subject:report security-performance-reliability`;
read the subject YAML, the neighbouring path sections and the architecture
measurement lesson; fetched the three SRE URLs named in the distributed systems
audit (HTTP 200). No other external source was opened.
