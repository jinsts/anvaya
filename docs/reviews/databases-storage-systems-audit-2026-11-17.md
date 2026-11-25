---
title: Databases & Storage Systems audit against the subject standard
status: draft
drafter: agent
auditDate: 2026-11-17
auditedCommit: 6d48b46
scope: curriculum only
standard: docs/SUBJECT_STANDARD.md
---

# Databases & Storage Systems audit

## Verdict

The overview is clear about trade-offs, and the subject is the most feasible to
build to the standard. Node 24's built-in SQLite runs query plans inside the
gate, and storage-engine mechanisms are natural tested models. The outline has
four problems:

- "Replication and partitioning" is planned in two subjects.
- Three transaction titles overlap each other.
- Two index titles overlap each other.
- Practical SQL, which interviews test directly, has no topic.

**P0 0, P1 2, P2 3, P3 1.**

## What is present

From `pnpm subject:report databases-storage-systems`: one path section, 12
planned topics, no lessons, labs or problems, and an overview with all keys
including a 7-chapter sketch. One flag: C5, "Replication and partitioning"
also planned under distributed systems.

## Scores

L, V, E, P and W are n/a: there are no lessons.

| Group | ID          | Score   | Evidence or exceptions                                                                                                             |
| ----- | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| C     | C1          | partial | Engine internals, transactions and scale-out covered; SQL querying and schema migrations missing (F4).                             |
| C     | C2          | partial | No boundary stated with distributed systems or with architecture's storage lesson (F1, F5).                                        |
| C     | C3          | partial | Path order is fine (OS first; DSA is outside this path and unchecked). "Indexing" precedes the B-tree topic that explains it (F3). |
| C     | C4          | partial | Transaction and index titles are split oddly rather than too broad (F2, F3).                                                       |
| C     | C5          | fail    | "Replication and partitioning" is duplicated across subjects (F1).                                                                 |
| C     | C6          | fail    | No running thread proposed (F6).                                                                                                   |
| C     | C7          | pass    | Overview claims map onto planned topics, except migrations (F4).                                                                   |
| C     | C8          | pass    | One section; the sketch agrees with the planned list.                                                                              |
| —     | Feasibility | pass    | `node:sqlite` runs `EXPLAIN QUERY PLAN` in the gate; Postgres can be extracted; sources need registering.                          |

## Findings

### F1 · P1. "Replication and partitioning" is planned in two subjects (C5)

[Path line 139](../../src/content/paths/engineering-fundamentals.yaml#L139) and
[line 168](../../src/content/paths/engineering-fundamentals.yaml#L168) carry
the same title. Distributed systems lists databases as a prerequisite, so the
order works if the scope splits. **Fix:** databases owns single-leader
replication mechanics (log shipping, replication lag, read-your-writes) and
partitioning schemes (hash, range, rebalancing, secondary indexes).
Distributed systems owns leaderless quorums and consensus-based replication,
and links back. Rename both titles to say so in the same planning change.

### F2 · P1. Three transaction titles overlap (C4, C5)

"Transactions and ACID properties", "Isolation levels, locking, and MVCC" and
"Concurrency control" (lines 135–137) describe overlapping material, so
concurrency control would be taught twice. **Fix:** replace them with pages
by mechanism. For example: what a transaction promises (ACID) → isolation
anomalies → two-phase locking → MVCC snapshots → serializable snapshot
isolation and write skew.

### F3 · P2. Index titles overlap and are ordered oddly (C3, C4)

"Indexing and data structures" comes before "B-trees, B+ trees, and LSM trees",
but explaining an index needs the B+ tree. **Fix:** pages for the B+ tree
(search, splits, range scans), the LSM tree (memtable, SSTables, compaction,
Bloom filters), then using indexes (composite keys, covering indexes,
selectivity) placed after query planning's basics.

### F4 · P2. SQL querying and migrations have no topic (C1)

Interviews for backend and data roles test SQL directly: joins, aggregation,
window functions and query rewriting. The overview's applications include
schema migrations and backfills that do not lock production tables. Neither
has a planned topic. **Fix:** add "SQL for engineers" (one or two pages) and
"Schema evolution and online migrations". Decide whether SQL problems from a
registered bank fit P7. LeetCode's database problems are a candidate, with
memberships verified as usual.

### F5 · P2. Sources and the storage boundary (E8, C2)

No database-specific source is registered. `ostep` covers crash consistency
and journaling, and `open-data-structures` and `algs4` cover B-trees. Storage
media are already taught in
[dram-ssd-and-disks](../../src/content/lessons/computer-architecture-execution/dram-ssd-and-disks.mdx);
"Caching and storage performance" should link there, not re-teach it.
**Fix:** candidates to open and register: the PostgreSQL documentation
(postgresql.org/docs), the SQLite documentation (sqlite.org), _Architecture of
a Database System_ (Hellerstein, Stonebraker and Hamilton) and CMU 15-445
lecture notes. None was opened for this audit.

### F6 · P3. No running thread (C6)

The overview's own experiment, a toy key-value store from an append-only log
grown with an index, compaction and a write-ahead log, would make an excellent
thread across the engine chapters. **Fix:** propose it.

## Feasibility note

`node:sqlite` in Node 24 was run here and returned
`SEARCH t USING INDEX i (a=?)` for an indexed lookup. Plans and isolation
behaviour of SQLite can therefore be recorded and asserted inside the gate.
PostgreSQL 18 is available to `apt-get download` for MVCC and isolation-level
experiments that SQLite cannot show, as recorded artifacts with drift checks.

## Factual errors

None found; overview claims were read, not checked against external sources.

## Report flags that are not findings

None; the C5 flag is F1.

## Standard feedback

None.

## Recommended sequence

1. Decide F1 together with the distributed systems outline.
2. Run create-subject with F2–F4 resolved in the proposal.
3. One planning change, then lesson-by-lesson drafting.

## Verification performed

On 2026-11-17 at `6d48b46`: `pnpm subject:report databases-storage-systems`;
read the subject YAML and the path sections of this subject and distributed
systems; ran a `node:sqlite` `EXPLAIN QUERY PLAN` in Node 24.21.0; checked
`apt-cache policy` for PostgreSQL 18 and SQLite. No external source was opened.
