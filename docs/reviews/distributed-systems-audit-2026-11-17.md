---
title: Distributed Systems audit against the subject standard
status: draft
drafter: agent
auditDate: 2026-11-17
auditedCommit: 6d48b46
scope: curriculum only
standard: docs/SUBJECT_STANDARD.md
---

# Distributed Systems audit

## Verdict

The overview is the most precise in the curriculum; it asks for CAP "rather
than as slogans" and names fencing tokens, outboxes and hybrid clocks. The
planned list does not match it. Time, clocks and causality have an overview
objective and a sketched chapter but no planned topic. Several titles are
vague or overlap each other and neighbouring subjects. Every mechanism can be
simulated deterministically in TypeScript, so the evidence is very feasible.
**P0 0, P1 2, P2 3, P3 1.**

## What is present

From `pnpm subject:report distributed-systems`: one path section, 14 planned
topics, no lessons, labs or problems, and an overview with all keys including a
7-chapter sketch. One flag: C5, "Replication and partitioning" also planned
under databases.

## Scores

L, V, E, P and W are n/a: there are no lessons.

| Group | ID          | Score   | Evidence or exceptions                                                                                                      |
| ----- | ----------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| C     | C1          | partial | Strong coverage, but time and clocks are missing (F1).                                                                      |
| C     | C2          | partial | Overlaps with databases, networking, SPR and SE are unstated (F2, F3).                                                      |
| C     | C3          | pass    | Networking and databases precede it in the path.                                                                            |
| C     | C4          | partial | Consensus and consistency need several pages; two titles are too vague to size (F4).                                        |
| C     | C5          | fail    | Duplicate title with databases; internal overlap of resilience titles (F2, F3).                                             |
| C     | C6          | fail    | No running thread proposed (F6).                                                                                            |
| C     | C7          | fail    | The overview's time-and-ordering objective and chapter have no planned topic (F1).                                          |
| C     | C8          | partial | One section, but the sketch's "Time, ordering and causality" chapter is absent from the planned list (F1).                  |
| —     | Feasibility | partial | Simulations fit the gate; key sources (Raft, Lamport, Jepsen) need registering, and `google-sre-books` needs prefixes (F5). |

## Findings

### F1 · P1. Time, clocks and causality have no planned topic (C1, C7, C8)

The overview's second objective is to "reason about time, causality and
ordering with logical and hybrid clocks". Its mechanisms list Lamport, vector
and hybrid logical clocks, and its chapter sketch has "Time, ordering and
causality". None of the 14 planned titles
([lines 164–177](../../src/content/paths/engineering-fundamentals.yaml#L164))
covers them. "Delivery guarantees and message ordering" is about messaging, not
clocks. **Fix:** add planned pages: physical clocks and their limits, Lamport
clocks, and vector and hybrid clocks.

### F2 · P1. Replication is planned twice (C5)

The same title appears under databases
([line 139](../../src/content/paths/engineering-fundamentals.yaml#L139)) and
here ([line 168](../../src/content/paths/engineering-fundamentals.yaml#L168)).
**Fix:** as proposed in the databases audit, this subject owns leaderless
quorums, read repair, consensus-based replication and consistency models;
databases owns single-leader mechanics and partitioning schemes. Rename this
title, for example "Quorums and leaderless replication".

### F3 · P2. Resilience is spread over several titles and subjects (C5)

- Inside the subject: "Retries, timeouts, and idempotency" and "Fault
  tolerance and resilience". The overview's resilience mechanisms (backoff with
  jitter, circuit breakers, bulkheads, load shedding) could sit in either.
- Across subjects: security-performance-reliability's "Reliability
  engineering and failure recovery".
- "Scalability and architectural trade-offs" overlaps software engineering's
  "Architectural styles and patterns".

**Fix:** this subject owns failure-handling mechanisms at the protocol and
client level (timeouts, retries, idempotency, circuit breakers, load shedding).
SPR owns operating reliability (SLOs, incidents, recovery objectives). SE owns
architectural styles. Each links to the others.

### F4 · P2. Some titles need splitting and two are too vague (C4)

- "Consensus and leader election" needs pages for Raft elections, log
  replication and safety.
- "Consistency and availability" needs pages for the consistency models,
  linearizability, and CAP and PACELC stated precisely.
- "Distributed state management" and "Communication between distributed
  components" do not name a mechanism, so they cannot be sized.

**Fix:** split and rename these in the proposal. For example, "Communication"
could become "RPC semantics and failure", and "state management" could become
"CRDTs and convergent state", or be dropped.

### F5 · P2. Sources (E8)

`aws-builders-library` covers timeouts, retries, backoff and idempotent APIs.
`system-design-primer` and `hello-interview` give interview framing.
`google-sre-books` is registered with the prefix `https://sre.google/books/`,
but the book chapters live under `https://sre.google/sre-book/` and
`https://sre.google/workbook/`; both returned HTTP 200 when checked. Any
chapter citation would fail the build until those prefixes are added. **Fix:**
add the prefixes (an add-source change). Candidates to open and register: the
Raft paper and site (raft.github.io), Lamport's "Time, Clocks, and the Ordering
of Events", Jepsen's consistency-model reference (jepsen.io/consistency) and
MIT 6.5840 notes.

### F6 · P3. No running thread (C6)

A small replicated key-value store, partitioned, then replicated with quorums,
then made consensus-backed, would thread the subject and connect to the
databases subject's log-structured store. **Fix:** propose it.

## Feasibility note

Every planned mechanism has a deterministic model that the gate can test:

- a seeded message-loss, duplication and reordering simulator;
- Lamport and vector clocks;
- quorum reads and writes under partitions;
- Raft elections and log replication;
- idempotency keys under retries;
- saga compensation.

Steppers over those models suit the standard's visual properties well. No
native toolchain is needed.

## Factual errors

None found; overview claims were read, not checked against external sources.

## Report flags that are not findings

None; the C5 flag is F2.

## Standard feedback

- **C8:** this subject shows why the sketch and the planned list must agree
  while a subject has one section. Its sketched chapter has no planned topic,
  and the build cannot see that. Proposed change: state in C8 that they must
  agree, and let the report compare them.

## Recommended sequence

1. Add the `google-sre-books` prefixes (small source change; also unblocks SPR).
2. Settle F2 and F3 with the databases, SPR and SE outlines.
3. Run create-subject with F1 and F4 resolved.
4. One planning change, then lesson-by-lesson drafting.

## Verification performed

On 2026-11-17 at `6d48b46`: `pnpm subject:report distributed-systems`; read the
subject YAML and the neighbouring path sections; fetched
`https://sre.google/books/`, `https://sre.google/sre-book/service-level-objectives/`
and `https://sre.google/workbook/implementing-slos/` (all HTTP 200) and the
books page's links. No other external source was opened.
