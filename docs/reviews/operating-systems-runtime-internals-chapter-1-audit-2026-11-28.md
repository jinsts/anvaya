---
title: Operating Systems & Runtime Internals, Chapter 1, audit against the subject standard
status: draft
drafter: agent
auditDate: 2026-11-28
auditedCommit: 0189335
scope: chapter os-kernel-boundary
standard: docs/SUBJECT_STANDARD.md
---

# Operating Systems & Runtime Internals: Chapter 1 audit

## Verdict

Chapter 1, "The kernel boundary and processes", meets the standard for an
agent draft. All five planned pages are drafted, each with an attempt lab,
figures computed from its model or recordings, evidence through the shared
native runner, and a verification record. No factual error or learner-blocking
gap was found. The main weaknesses are a running thread that fades after the
second page, one analogy that echoes another, and evidence that comes from a
cloud VM rather than the owner's WSL2 machine. The next step is owner review
and owner-run recordings, not more fixes. **P0 0, P1 0, P2 1, P3 4.**

## What is present

From `pnpm subject:report operating-systems-runtime-internals#os-kernel-boundary`
at 0189335: one chapter, five lessons, no planned topics, no flags.

| Lesson           | Min | Obj |  IQ | Sources | Predict | Check-after | Cards | Figures (from labs) | Verified (in tests) | Lab cases | Problems |
| ---------------- | --: | --: | --: | ------: | ------: | ----------: | ----: | ------------------: | ------------------: | --------: | -------: |
| system-calls     |  25 |   3 |   4 |      14 |       2 |           4 |     2 |               3 (3) |               1 (1) |         9 |        0 |
| processes        |  25 |   3 |   4 |       8 |       1 |           3 |     2 |               3 (3) |               1 (1) |        10 |        0 |
| threads          |  20 |   3 |   4 |       8 |       1 |           3 |     2 |               2 (2) |               1 (1) |         9 |        0 |
| scheduling       |  30 |   3 |   4 |       8 |       1 |           4 |     2 |               4 (4) |               1 (1) |        11 |        0 |
| context-switches |  20 |   3 |   4 |       5 |       1 |           3 |     2 |               2 (2) |               1 (1) |         9 |        0 |

Total 120 minutes, 48 hidden contract cases, two interactive steppers
(`ForkStepper`, `SchedStepper`), each with a static table behind a "Check after
stepping" disclosure.

## Scores

| Group | ID  | Score   | Evidence or exceptions                                                                                                                                                                                                                                                             |
| ----- | --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C     | C1  | pass    | The chapter covers the approved proposal's Chapter 1 units: system-call entry and the vDSO, fork/exec/wait and zombies, thread versus process sharing, weighted fair scheduling, and switch cost. Interview themes from the proposal appear as interview questions in each lesson. |
| C     | C2  | pass    | The subject overview states its boundary; lessons defer what they leave out to named later chapters (copy-on-write to memory, container init to containers, runtime schedulers to the runtime chapters).                                                                           |
| C     | C3  | pass    | Each lesson's prerequisite is the page before it in the path; nothing is used before it is taught.                                                                                                                                                                                 |
| C     | C4  | pass    | 20–30 minutes each, one mechanism per page.                                                                                                                                                                                                                                        |
| C     | C5  | pass    | The nice value is taught in scheduling and only noted in threads with a link; the context switch is defined in context-switches and scheduling links there; system-call entry links back to the architecture lesson that teaches traps.                                            |
| C     | C6  | partial | `serve` and the launcher recur in system-calls and processes, and threads opens from the launcher, but scheduling and context-switches start new scenarios (F1).                                                                                                                   |
| C     | C7  | pass    | The overview's three Chapter 1 experiments (strace of a file read, thread versus child through /proc, ping-pong) are each recorded in a lesson.                                                                                                                                    |
| C     | C8  | pass    | Path sections are the outline; the overview has no chapter list.                                                                                                                                                                                                                   |
| L     | L1  | pass    | Three objectives each; existing tags and skills; `status: draft`, `drafter: agent` in every lesson.                                                                                                                                                                                |
| L     | L2  | pass    | Four questions per lesson with assumptions stated; one wording to tighten (F4).                                                                                                                                                                                                    |
| L     | L3  | partial | Every hook has an analogy and "The analogy stops at …"; context-switches' shared desk echoes threads' office desks (F2).                                                                                                                                                           |
| L     | L4  | pass    | Each mechanism section has its figure; models state what they leave out (for example scheduling's EEVDF note).                                                                                                                                                                     |
| L     | L5  | pass    | Every lesson has a body prediction followed by a disclosure or widget (report: no ungated predictions).                                                                                                                                                                            |
| L     | L6  | pass    | Answers sit in "Check after …" disclosures, including the sharing table and the switch-cost figure; no reveal before an attempt was found on reading.                                                                                                                              |
| L     | L7  | pass    | Worked examples come from recordings (serve's trace, launcher output, share.c output, fair.json, switch.json) or the tested model.                                                                                                                                                 |
| L     | L8  | pass    | Each lesson names a common mistake and states its model's limits beside the figure or code.                                                                                                                                                                                        |
| L     | L9  | pass    | Every lesson has the tested-model disclosure followed by "The tests check …".                                                                                                                                                                                                      |
| L     | L10 | pass    | `01 /` is the attempt lab with `pnpm lab`; `02 /` paper tasks carry no command.                                                                                                                                                                                                    |
| L     | L11 | pass    | One ConceptCheck with three explained options in each lesson.                                                                                                                                                                                                                      |
| L     | L12 | pass    | 4–5 recap points each.                                                                                                                                                                                                                                                             |
| L     | L13 | pass    | Links name what their targets teach; the build validated every link and anchor.                                                                                                                                                                                                    |
| V     | V1  | pass    | Every lesson has at least two figures of real state.                                                                                                                                                                                                                               |
| V     | V2  | pass    | Every figure imports its values from `labs/` (report: all figures computed).                                                                                                                                                                                                       |
| V     | V3  | pass    | `pnpm shots` at 390 and 1280 px in both themes for every lesson, no overflow; wide tables scroll in labelled regions.                                                                                                                                                              |
| V     | V4  | pass    | Axe scans pass in the browser suite; steppers use native controls and `role="status"`; bars carry numbers as text.                                                                                                                                                                 |
| V     | V5  | pass    | Both steppers have static tables; every lesson is captured without JavaScript.                                                                                                                                                                                                     |
| V     | V6  | pass    | Both steppers are manual and ask for a prediction; keyboard tests in `tests/e2e/operating-systems.spec.ts`.                                                                                                                                                                        |
| V     | V7  | pass    | The context-switches model's example says its timings are illustrative.                                                                                                                                                                                                            |
| V     | V8  | n/a     | No figure was replaced.                                                                                                                                                                                                                                                            |
| E     | E1  | pass    | All code shown is imported from `labs/` with `?raw`.                                                                                                                                                                                                                               |
| E     | E2  | pass    | Every verified output is asserted (report).                                                                                                                                                                                                                                        |
| E     | E3  | pass    | Program outputs and traces are drift-checked by the shared runner against `toolchain.json` (ADR 0010).                                                                                                                                                                             |
| E     | E4  | partial | Measurements store date, compiler, flags, CPU, caches, kernel, VM and every run, and alternate candidates; there is no checksum field, because the programs assert every result instead (see Standard feedback; F3).                                                               |
| E     | E5  | pass    | Every measured figure names the cloud VM and says it is not the owner's WSL2 machine.                                                                                                                                                                                              |
| E     | E6  | n/a     | No owner-only tool is used in this chapter; Docker and perf come later.                                                                                                                                                                                                            |
| E     | E7  | pass    | Results come from committed recordings; no list membership or result is claimed without one.                                                                                                                                                                                       |
| E     | E8  | pass    | Every citation is a page under a registered source that the verification records list as opened.                                                                                                                                                                                   |
| E     | E9  | pass    | Hypotheses are marked ("probably", "the likely reason") and listed for the owner in each record.                                                                                                                                                                                   |
| E     | E10 | n/a     | No earlier record needed correcting.                                                                                                                                                                                                                                               |
| P     | P1  | pass    | Five labs, folders match slugs, all files present.                                                                                                                                                                                                                                 |
| P     | P2  | pass    | 9–11 `unseen case` contracts each, with boundary and invalid inputs expecting `RangeError`, `TypeError` or `SyntaxError`.                                                                                                                                                          |
| P     | P3  | pass    | `pnpm lab` fails every case in all five labs (run for each lesson before its commit).                                                                                                                                                                                              |
| P     | P4  | pass    | Cross-checks: real strace output, a Python implementation (processes), manual pages and the recorded share.c, a hand-computed decision table, and a hand computation over recorded batches.                                                                                        |
| P     | P5  | pass    | READMEs and lessons give the contract and one worked case, not the hidden values.                                                                                                                                                                                                  |
| P     | P6  | pass    | Each README is titled "Independent practice" with contract, command and provenance.                                                                                                                                                                                                |
| P     | P7  | pass    | No problem is linked; none in the registered bank fits these pages.                                                                                                                                                                                                                |
| W     | W1  | pass    | Drafts only.                                                                                                                                                                                                                                                                       |
| W     | W2  | pass    | Every page was planned in the approved planning change (f67ff57).                                                                                                                                                                                                                  |
| W     | W3  | pass    | One lesson per commit (d868a05, 1f2e5c2, 536db1d, 751825f, 0189335); runner extensions a lesson needed were made in that lesson's commit.                                                                                                                                          |
| W     | W4  | pass    | Each record describes lab, model and recording before figures and prose.                                                                                                                                                                                                           |
| W     | W5  | pass    | Full `pnpm verify` with the toolchain environment before every commit; screenshots reviewed.                                                                                                                                                                                       |
| W     | W6  | pass    | One dated VERIFICATION entry per change.                                                                                                                                                                                                                                           |
| W     | W7  | pass    | Conventional commits with bodies.                                                                                                                                                                                                                                                  |
| W     | W8  | pass    | Owner items listed in every record.                                                                                                                                                                                                                                                |
| W     | W9  | pass    | Path entries, cross-links and the catalog test lists were updated with each lesson.                                                                                                                                                                                                |
| W     | W10 | pass    | Pushes only to the session branch, as the owner authorized.                                                                                                                                                                                                                        |

## Findings

### F1 · P2. The running thread fades after the processes page (C6)

`serve` and the launcher carry the
[system-calls](../../src/content/lessons/operating-systems-runtime-internals/system-calls.mdx)
and [processes](../../src/content/lessons/operating-systems-runtime-internals/processes.mdx)
pages, and [threads](../../src/content/lessons/operating-systems-runtime-internals/threads.mdx#L85)
opens from the launcher. [Scheduling](../../src/content/lessons/operating-systems-runtime-internals/scheduling.mdx#L85)
then introduces a web server and batch job, and context-switches a pipe
ping-pong, without tying either back to `serve`. A learner loses the sense of
one program growing through the chapter. Smallest fix: open scheduling with
the launcher's server running many `serve` workers beside a batch job, and
frame the ping-pong as two `serve`-like workers handing a request back and
forth. enhance-lesson, one page each.

### F2 · P3. The context-switch analogy echoes the threads analogy (L3)

[Threads](../../src/content/lessons/operating-systems-runtime-internals/threads.mdx#L90)
uses colleagues with their own desks in one office;
[context-switches](../../src/content/lessons/operating-systems-runtime-internals/context-switches.mdx#L86)
uses a desk shared in shifts. They teach different points, but the imagery is
close enough to blur. Replace the context-switch analogy (for example, a
player moving between boards in a simultaneous chess exhibition, which stops
at the board keeping its position while the CPU's caches do not).
enhance-lesson.

### F3 · P3. Measurements validate results but record no checksum (E4)

`fair.c` and `switch.c` assert every byte and bound, and the runner stores
every run, but the JSON files carry no checksum field as E4 words it. The
asserts serve the same purpose here. See Standard feedback; no change unless
the owner wants one.

### F4 · P3. One interview answer rounds the switch cost loosely (L2)

[Context-switches line 24](../../src/content/lessons/operating-systems-runtime-internals/context-switches.mdx#L24)
says the direct cost is "about a microsecond on current hardware". OSTEP
chapter 6 reports sub-microsecond results on modern machines, and the
recording measured 1.0–1.2 µs on a VM. Say "around a microsecond or less" and
keep the recorded numbers. enhance-lesson.

### F5 · P3. Owner-machine recordings are still to do (E5)

Every recording comes from the cloud VM, and each figure says so. The owner's
WSL2 machine may give different scheduler delays and switch costs. Rerun
`node labs/operating-systems-runtime-internals/native/registry.ts
--record-measurements` there with `ANVAYA_ENVIRONMENT` set, and compare.

## Factual errors

None found. Claims were checked against the cited pages opened for each
lesson (listed in each VERIFICATION entry), the recorded artifacts, and the
lab tests that assert the relationships the prose states.

## Report flags that are not findings

The report raised no flags.

## Standard feedback

- **E4 checksum.** For compute kernels a checksum proves the timed work
  happened; for OS measurements such as a pipe ping-pong or a scheduler
  share, the program's own assertions (every byte answered, CPU time bounded
  by wall time) do that job. Proposal: let E4 accept "a checksum or asserted
  result".

## Recommended sequence

1. Owner review of the five drafts, attempting each lab first.
2. Owner-run recordings on WSL2 (F5), then compare the figures.
3. F1 on scheduling and context-switches, one enhance-lesson change each,
   with F2 and F4 folded into the context-switches change.

## Verification performed

- `pnpm subject:report operating-systems-runtime-internals#os-kernel-boundary`
  at 0189335: five lessons, no flags.
- `pnpm verify` with the toolchain environment before each lesson commit, the
  last at 0189335's tree: 536 tests passed, 1 skipped (Docker), 45 pages, 168
  browser tests.
- `pnpm lab` for each of the five labs fails every case against its starter.
- `pnpm shots` and scratch captures of every figure at 390 and 1280 px in
  both themes, plus each page without JavaScript.
- Read all five lessons, labs, READMEs and VERIFICATION entries for this
  audit. Not checked: the owner's machine, Docker, and a real (non-headless)
  browser.
