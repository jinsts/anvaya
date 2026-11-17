---
title: Operating Systems & Runtime Internals audit against the subject standard
status: draft
drafter: agent
auditDate: 2026-11-17
auditedCommit: 6d48b46
scope: curriculum only
standard: docs/SUBJECT_STANDARD.md
---

# Operating Systems & Runtime Internals audit

## Verdict

The overview is strong and specific, and the twelve planned topics cover the
kernel and two runtimes a backend engineer meets. As an outline for drafting it
is not ready. Five of the twelve titles each hold several teaching units, so
the subject is closer to 30 pages than 12. Three titles overlap material the
architecture subject already teaches. Containers, which the overview lists as
an application, have no topic. The next step is a create-subject planning pass,
not drafting. **P0 0, P1 2, P2 3, P3 1.**

## What is present

From `pnpm subject:report operating-systems-runtime-internals`: one path
section in `engineering-fundamentals`, 12 planned topics, no lessons, no labs,
no problems, and an overview with all keys including a 6-chapter sketch. The
report raised no flags.

## Scores

Lesson-level groups (L, V, E, P) and the per-change process (W) are n/a: there
are no lessons.

| Group | ID          | Score   | Evidence or exceptions                                                                                                                 |
| ----- | ----------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| C     | C1          | partial | Kernel, memory, concurrency, I/O and two runtimes are covered; containers, signals and IPC, and async runtimes are not (F3).           |
| C     | C2          | partial | The overview names Linux, Node.js and the JVM, but not what stays with architecture or networking (F2).                                |
| C     | C3          | pass    | Prerequisite `computer-architecture-execution` precedes it in the path; topic order is kernel → memory → concurrency → I/O → runtimes. |
| C     | C4          | fail    | Five titles are several units each (F1).                                                                                               |
| C     | C5          | partial | No exact duplicate titles; three overlaps with drafted architecture lessons (F2).                                                      |
| C     | C6          | fail    | No running thread is proposed yet (F6).                                                                                                |
| C     | C7          | partial | Overview applications include containers (namespaces, cgroups) that no topic teaches (F3).                                             |
| C     | C8          | pass    | One section; the 6-chapter sketch is allowed until the subject is divided.                                                             |
| —     | Feasibility | partial | Strong lab and evidence options; runtime and Linux-tool sources not registered (F4, F5).                                               |

## Findings

### F1 · P1. Five planned titles each hold several teaching units (C4)

[Path lines 98–109](../../src/content/paths/engineering-fundamentals.yaml#L98)
list 12 topics, but each of these needs several 15–30 minute pages:

| Planned title                                    | Likely pages                                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Processes, threads, and scheduling               | process lifecycle (`fork`/`exec`/`wait`); threads and what they share; context switches and the CFS/EEVDF fairness model |
| Virtual memory and memory management             | page tables and faults; copy-on-write and overcommit; the page cache and resident memory; user-space allocators          |
| Concurrency and synchronization                  | mutexes and condition variables; semaphores and futexes; atomics versus locks                                            |
| Node.js, V8, and the event loop                  | libuv phases and the thread pool; microtasks and promises; V8 heap and garbage collection                                |
| JVM internals, garbage collection, and threading | class loading and JIT; memory areas and generational GC; concurrent collectors and tuning; threads and virtual threads   |

A realistic outline is 28–34 pages. Splitting now avoids the thin coverage the
2026-11-13 architecture audit found when nine broad topics became nine pages.
**Fix:** a create-subject proposal that splits each title into pages and groups
them into the six sketched chapters, followed by one planning change.

### F2 · P1. Overlaps with drafted architecture lessons need a single home (C2, C5)

- "Kernel and user space" and "System calls and I/O" overlap
  [hardware-software-interaction](../../src/content/lessons/computer-architecture-execution/hardware-software-interaction.mdx),
  which already teaches privilege, system-call entry and the saved return
  location, and [io-mechanisms](../../src/content/lessons/computer-architecture-execution/io-mechanisms.mdx),
  which teaches interrupts, DMA and completion.
- "Virtual memory and memory management" overlaps the TLB and page-fault
  distinction in [memory-hierarchy-and-caches](../../src/content/lessons/computer-architecture-execution/memory-hierarchy-and-caches.mdx)
  and allocation costs in [stack-and-heap](../../src/content/lessons/computer-architecture-execution/stack-and-heap.mdx).
- The path comment at [lines 70–76](../../src/content/paths/engineering-fundamentals.yaml#L70)
  already assigns locks, condition variables and deadlock to this subject. That
  boundary is consistent.

**Fix:** the proposal states that OS pages start where architecture stops (the
kernel's view: system-call dispatch, the vDSO, readiness and completion APIs,
page tables as data structures, the page cache), and links back instead of
re-teaching.

### F3 · P2. Containers, signals, IPC and async runtimes have no topic (C1, C7)

The overview lists namespaces and cgroups among its applications, and
container memory limits and out-of-memory kills among its uses, but no planned
topic teaches them. Signals, pipes and other IPC, and `async`/`await` runtimes
beyond Node.js, are also common interview and production topics. **Fix:** add
"Containers: namespaces and cgroups" and "Signals, pipes and process
communication" as planned pages, or record them as out of scope. Decide whether
"Language runtime internals" means a general page (stacks, coroutines, green
threads) before the Node.js and JVM case studies.

### F4 · P2. Runtime and Linux-tool sources are not registered (E8 feasibility)

`ostep`, `man7-linux-man-pages` and `linux-kernel` cover the kernel well. Nothing
registered covers Node.js, libuv, V8 or the JVM. **Fix:** candidate sources to
open and register when the outline is approved: the Node.js documentation's
event-loop guide (nodejs.org), libuv's design overview (docs.libuv.org), the
V8 blog's garbage-collection articles (v8.dev), the Java Virtual Machine
Specification and the OpenJDK/Oracle GC tuning guides (docs.oracle.com). None
was opened for this audit.

### F5 · P2. Native evidence needs tools that are not installed here (E3, E6)

`strace`, `gdb`, `perf`, `java` and `iostat` are not installed. `vmstat`, `ss`,
`ip`, `node` 24 and Docker are present. Ubuntu packages for `strace` and OpenJDK
21 are available to `apt-get download` and can be extracted without root, like
the architecture GCC. **Fix:** plan a native lab that uses the existing GCC for
C programs (fork, threads, futex contention, mmap), Node.js itself for
event-loop measurements inside the gate, extracted `strace` and OpenJDK for
recorded artifacts with drift checks, and owner-run scripts for `perf` and
anything needing privileges.

### F6 · P3. No running thread yet (C6)

The architecture subject reused `bump` and `scale_sum` across lessons. A small
server program (accept, read a file, respond), followed through processes,
memory, I/O and then the two runtimes, would give this subject the same
continuity. **Fix:** propose it in the outline.

## Feasibility note: labs fit the attempt pattern (P1)

Most mechanisms have deterministic models that can be contract-tested in
TypeScript: a scheduler's run order, page-table translation and fault
classification, copy-on-write sharing, lock-order deadlock detection, the libuv
phase order and microtask draining. The proposal should name the model for each
page.

## Factual errors

None found. The overview's claims were read for consistency with the planned
topics and the architecture lessons, not checked against external sources.

## Report flags that are not findings

The report raised none for this subject.

## Standard feedback

- **C8:** while a subject has one section, `overview.chapters` and the planned
  list are two outlines that can disagree. Here they agree, but see the
  distributed systems audit. Proposed change: require them to agree until the
  subject is divided.

## Recommended sequence

1. Run create-subject for this subject: intake, then a proposal that splits the
   five broad titles, settles the architecture boundary and adds containers and
   IPC or excludes them.
2. One planning change: chapter sections, planned pages, sources registered,
   the native lab skeleton (GCC, extracted `strace` and OpenJDK).
3. Draft lesson by lesson with draft-lesson.

## Verification performed

On 2026-11-17 at `6d48b46`: `pnpm subject:report operating-systems-runtime-internals`
(no flags); read the subject YAML, its path section and the architecture
lessons named above; checked tool availability with `command -v` and
`apt-cache policy`. No external source was opened for this audit, so the
candidate sources above are unverified suggestions.
