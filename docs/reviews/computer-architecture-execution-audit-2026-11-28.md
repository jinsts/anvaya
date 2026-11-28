---
title: Computer Architecture & Execution audit against the subject standard
status: draft
drafter: agent
auditDate: 2026-11-28
auditedCommit: 99faf4e
scope: subject
standard: docs/SUBJECT_STANDARD.md
---

# Computer Architecture & Execution audit

## Verdict

The subject now meets the standard on every property the 2026-11-17 audit
found wanting: no page runs past 45 minutes, every lesson says what its tests
check, every figure that shows values computes them from a tested model or a
recording, every lab has at least five hidden cases and a README that states
its contract, and the analogies, links and practice headings follow the
standard's forms. No factual error was found, and nothing blocks or misleads a
learner. Two gaps remain, both in the practice labs and both missed by the
earlier audit: seven hidden contracts test no invalid input (P2), and in
thirteen lessons the first practice card asks the learner to predict a hidden
case and its reveal gives the answer (P5). Neither changes what a lesson
teaches; the next step is one enhance-lesson change per lab.
**P0 0, P1 0, P2 2, P3 2.**

## What is present

From `pnpm -s subject:report computer-architecture-execution --json` at
`99faf4e`:

| Measure                                     | Count                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| Chapters                                    | 6                                                                        |
| Lessons                                     | 22 (19 before this branch; three new pages split from the three longest) |
| Planned topics                              | 0                                                                        |
| Minutes per lesson                          | 30–40, 735 in total                                                      |
| Objectives / interview questions per lesson | 3–4 / 3–5                                                                |
| Imported figures and widgets                | 62, of which 60 read from `labs/` (the other two are concept figures)    |
| Verified outputs                            | 23 in 22 lessons, each asserted by a lab test                            |
| Hidden contract cases per lab               | 5–9                                                                      |
| Linked problems                             | 14                                                                       |
| Report flags                                | 18: C4 11 (information), L6 2, V2 2, P1 3, each judged below             |

## Scores

| Group | ID  | Score   | Evidence or exceptions                                                                                                                                                                                                                                               |
| ----- | --- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C     | C1  | pass    | The overview's objectives and mechanisms each map to a lesson; the TLB, average access time, frames and notification now have their own pages.                                                                                                                       |
| C     | C2  | pass    | The path comments hand locks, scheduling and page tables to the operating systems subject; multicore and the access-time page link it as planned.                                                                                                                    |
| C     | C3  | pass    | New prerequisites follow the path: `reading-assembly` → `call-frames` → `stack-and-heap`, `memory-hierarchy-and-caches` → `access-time-and-translation`, `hardware-software-interaction` → `polling-interrupts-and-dma` → `io-mechanisms`; the build rejects cycles. |
| C     | C4  | pass    | No page above 40 minutes. Eleven pages at 35–40 are one mechanism each, which owner decision S1 accepts. The three split pages and their originals are at 30–35.                                                                                                     |
| C     | C5  | pass    | Average access time, the TLB, frames, stack overflow, PIO/DMA and polling each moved with their material; the originals keep one-sentence reminders with links. No duplicate planned titles.                                                                         |
| C     | C6  | pass    | `scale_sum`/`sum_to` now run through the frames page too (`StackDepth`, `stackPointer.test.ts`); the burst and single-completion examples recur across the polling and I/O pages.                                                                                    |
| C     | C7  | pass    | The overview lists no lessons and makes no claim the split changes; it still says the `perf stat` experiment has no recorded output.                                                                                                                                 |
| C     | C8  | pass    | Six chapter sections; no `overview.chapters`.                                                                                                                                                                                                                        |
| L     | L1  | pass    | 3–4 objectives each; every lesson `draft` by `agent`.                                                                                                                                                                                                                |
| L     | L2  | pass    | 3–5 questions each; the moved questions went with their material, and `io-mechanisms` gained one on descriptor ordering to keep three.                                                                                                                               |
| L     | L3  | pass    | Every hook has a scenario, an analogy and "The analogy stops at …" (report: no L3 flag); DRAM's analogy no longer repeats memory's, and the new pages use a delayed flight, bookmarks and a kettle.                                                                  |
| L     | L4  | pass    | Each mechanism section has a figure; the split pages' sections are anchored by `AccessTimeParts`, `RealFrames`, `TransferTimeline` and `PollingTimeline`, with the answer-bearing figures in reveals.                                                                |
| L     | L5  | pass    | Every lesson has a predict prompt before Practice (report: no L5 flag).                                                                                                                                                                                              |
| L     | L6  | pass    | No answer precedes its attempt; the two L6 flags are prose (see below). The P5 finding concerns hidden cases answered after the attempt.                                                                                                                             |
| L     | L7  | pass    | A worked trace or calculation in all 22.                                                                                                                                                                                                                             |
| L     | L8  | pass    | Model boundaries sit beside the figures and models ("blocking and sequential", "illustrative units", "tracks only rsp's rules").                                                                                                                                     |
| L     | L9  | pass    | Every model disclosure has a verified output and a paragraph starting "The tests check" (report: no L9 flag), reading assembly included.                                                                                                                             |
| L     | L10 | pass    | `## Practice` everywhere, cards numbered from `01 /`, card 01 runs `pnpm lab`, paper tasks carry no command.                                                                                                                                                         |
| L     | L11 | pass    | One three-option ConceptCheck per lesson (asserted by `lessons.spec.ts`).                                                                                                                                                                                            |
| L     | L12 | pass    | 5–6 recap points each.                                                                                                                                                                                                                                               |
| L     | L13 | pass    | The stale links of F10 and the split's neighbours were fixed (registers → call frames, DRAM → access time, hardware-software → polling); the build validates every target.                                                                                           |
| V     | V1  | pass    | A visible `.diagram-frame` in every lesson, asserted on desktop and mobile; the stack and I/O steppers are now framed.                                                                                                                                               |
| V     | V2  | pass    | `AmdahlBars`, `InstructionFields` and `CachePlacement` import their values; the two V2 flags are concept figures.                                                                                                                                                    |
| V     | V3  | pass    | `pnpm shots` on all 22 lessons: no page overflow, offending elements or console errors; touched figures reviewed at 390 and 1280 px in both themes, and the sweep's labels moved into a key on phones.                                                               |
| V     | V4  | pass    | Axe scans clean in both themes for all 22 (`lessons.spec.ts`).                                                                                                                                                                                                       |
| V     | V5  | pass    | Every lesson reads without JavaScript (asserted); answer-bearing figures sit in `<details>`, which work without it.                                                                                                                                                  |
| V     | V6  | pass    | No new widget; the new figures are static, with predictions before the reveals.                                                                                                                                                                                      |
| V     | V7  | pass    | Every new figure says its parameters or units are illustrative.                                                                                                                                                                                                      |
| V     | V8  | pass    | No unused component: `PollingTimeline` and `RealFrames` moved with their imports; nothing was replaced.                                                                                                                                                              |
| E     | E1  | pass    | Every `?raw` import is from `labs/`.                                                                                                                                                                                                                                 |
| E     | E2  | pass    | 23 verified outputs, each asserted exactly.                                                                                                                                                                                                                          |
| E     | E3  | pass    | The native runner compared all 28 artifacts under the recorded GCC 15.2 and binutils 2.46 in every gate run: unchanged.                                                                                                                                              |
| E     | E4  | pass    | No measurement changed; the tests still assert only the stated relationships.                                                                                                                                                                                        |
| E     | E5  | pass    | Unchanged; the multicore hook cites no number, and its claim rests on the recorded ratio.                                                                                                                                                                            |
| E     | E6  | pass    | `perf-counters.sh` stays owner-run with its exit status 2 tested; the measuring README now documents it.                                                                                                                                                             |
| E     | E7  | pass    | Every new value comes from a model run, a recording or a cited page; the 30-minute estimates are marked as judgments.                                                                                                                                                |
| E     | E8  | pass    | The new pages cite only registered sources whose pages were downloaded and read (MIT L14, OSTEP 19 and 36, Dive into Systems 7.5, the psABI PDF, the kernel's NAPI and DMA pages).                                                                                   |
| E     | E9  | pass    | New claims are backed by tests (practice answers, layouts, the interpreter cross-check) or by those pages.                                                                                                                                                           |
| E     | E10 | pass    | The 2026-11-17 audit gains a dated correction for the two gaps it missed.                                                                                                                                                                                            |
| P     | P1  | pass    | A lab per lesson; the three folder-name exceptions are documented (S4).                                                                                                                                                                                              |
| P     | P2  | partial | At least five cases everywhere, but seven contracts test no invalid input (A1).                                                                                                                                                                                      |
| P     | P3  | pass    | `pnpm lab` fails every case for every lab changed on this branch, and for the three new labs.                                                                                                                                                                        |
| P     | P4  | pass    | Every contract runs against its reference in the gate; the new and thickened contracts were cross-checked in Python or against the interpreter.                                                                                                                      |
| P     | P5  | partial | Memory, binary, execution and I/O no longer predict hidden cases; thirteen lessons still do (A2).                                                                                                                                                                    |
| P     | P6  | pass    | All 22 READMEs are "Independent practice" and state their contract.                                                                                                                                                                                                  |
| P     | P7  | pass    | 14 problems, unchanged; the circular-queue problem still fits the I/O page's submission and completion queues.                                                                                                                                                       |
| W     | W1  | pass    | All drafts; no `reviewedAt`.                                                                                                                                                                                                                                         |
| W     | W2  | pass    | The three pages were planned in their own commit before drafting, at the owner's request.                                                                                                                                                                            |
| W     | W3  | pass    | One lesson per commit; each split commit carries its new page and the material it took from one original.                                                                                                                                                            |
| W     | W4  | pass    | Each new lab was built and cross-checked before its figures and prose.                                                                                                                                                                                               |
| W     | W5  | pass    | The full gate with the toolchain ran before every commit; touched figures were reviewed at both widths and themes, including those inside disclosures.                                                                                                               |
| W     | W6  | pass    | One `docs/VERIFICATION.md` entry per change.                                                                                                                                                                                                                         |
| W     | W7  | pass    | Conventional commits with bodies.                                                                                                                                                                                                                                    |
| W     | W8  | pass    | Each entry ends with items for owner review.                                                                                                                                                                                                                         |
| W     | W9  | pass    | Path comments, cross-links and the stack README were updated with each move; one missed link (hardware-software → I/O) was fixed before this audit.                                                                                                                  |
| W     | W10 | pass    | Pushed only to this session's branch, as the owner authorized.                                                                                                                                                                                                       |

## Findings

### A1 · P2. Seven hidden contracts test no invalid input (P2)

P2 asks for normal, boundary and invalid inputs, with invalid inputs expecting
a specific error. These contracts have none:

- [cache-organization](../../labs/computer-architecture-execution/cache-organization/contracts.ts),
  [floating-point-representation](../../labs/computer-architecture-execution/floating-point-representation/contracts.ts)
  and [multicore](../../labs/computer-architecture-execution/multicore/contracts.ts):
  their models already refuse invalid input with a `RangeError` (a set count
  that is not a power of two or a negative address; a pattern outside 32 bits;
  a third core), so only the cases and the card's contract sentence are
  missing.
- [branch-prediction](../../labs/computer-architecture-execution/branch-prediction/contracts.ts),
  [pipelining-and-hazards](../../labs/computer-architecture-execution/pipelining-and-hazards/contracts.ts),
  [reading-assembly](../../labs/computer-architecture-execution/reading-assembly/contracts.ts)
  and [simd](../../labs/computer-architecture-execution/simd/contracts.ts): the
  models accept what they should refuse. Probed directly: `predict` accepts an
  outcome other than taken or not taken, `schedule` accepts an unknown
  instruction kind, `jumpTaken` accepts operands outside 32 bits and throws a
  plain `Error` for an unknown jump, and `sumByLanes` returns `null` for `NaN`.

A learner can pass these labs without handling bad input, which the other
fifteen labs require. **Fix:** for each lab, refuse invalid input with a
`RangeError` in the model (with a test), add a refusal case, and state it on
card 01 and in the README (enhance-lesson's lab-case recipe), one change per
lab.

### A2 · P2. Thirteen first cards predict a hidden case (P5)

P5 says the lesson states the contract and one worked case, "not the hidden
expected values". In these lessons card 01 asks for a prediction on inputs that
are hidden cases, and its "Check after attempting" reveal gives the expected
value: architecture-and-performance (case 2), branch-prediction (case 6),
cache-organization (cases 3 and 4; case 1 is also the static trace's stream),
compilation-and-execution (case 1), cpu-registers-and-instructions (cases 3 and
4), floating-point-representation (cases 2 and 5),
hardware-software-interaction (cases 4, 5 and 8), measuring-performance (case 6),
multicore-coherence-and-atomics (case 7), pipelining-and-hazards (cases 1 and 2),
reading-assembly (cases 1 and 3), simd-and-data-parallelism (case 5),
stack-and-heap (cases 1 and 2) and text-encoding-and-memory-layout (cases 2 and
4). The reveals follow the attempt, so no answer is given early (L6 passes),
but those cases no longer test anything the learner was not shown. The
2026-11-17 audit scored P5 partial for memory alone; this branch fixed memory,
binary, execution and I/O by predicting inputs no hidden case uses. **Fix:**
the same change per lesson, or the owner accepts one predicted hidden case as
P5's "one worked case" (Standard feedback S5).

### A3 · P3. Minutes recalibrated by word count (C4)

The memory and I/O lessons fell from 55 to 30 minutes and stack and heap from
50 to 35. Only part of that is the material that moved: their old estimates
were high for their length. The new figures follow the subject's own pages of
1,550–1,700 words with two practice tasks, which are estimated at 30. This is a
judgment; the owner may prefer to time a reading.

### A4 · P3. The subject report reads two prose sentences as prompts (L6)

`how-computers-execute-programs` ("Before each instruction, predict both the
new accumulator…", followed by the program's instruction table, with the trace
in a reveal) and `branch-prediction-and-speculation` ("Instead they
**predict** each branch") are not reveals. A tool change, not a content
change: the report could skip tables and bold prose.

## Factual errors

None found. Checks: every lab and model test passes in the gate; the native
runner reproduced all 28 artifacts; all 23 verified outputs are asserted; the
new pages' claims were read against the cited pages, and their numbers come
from tested models cross-checked in Python or against the interpreter. Claims
in lessons this branch did not touch were not re-read against their sources.

## Report flags that are not findings

- **C4 ×11:** one-mechanism pages at 35–40 minutes, accepted by S1.
- **L6 ×2:** prose, not prompts (A4).
- **V2 ×2:** `SpectreSteps` and `MeasureWorkflow` are concept figures with no
  values to compute.
- **P1 ×3:** `branch-prediction`, `simd` and `multicore` are documented
  exceptions (S4).

## Standard feedback

- **S5 (P5).** Most lessons ask learners to predict one hidden case before
  running the tests, and the reveal explains it. That is good teaching but
  makes the case visible. Either keep P5 strict and give each card a fresh
  input (A2), or let P5 accept one predicted hidden case as the "one worked
  case" when at least four others stay hidden. The agent recommends the strict
  reading, which this branch applied where it touched a card.

## Recommended sequence

1. A1 for the three labs whose models already refuse (cache organization,
   floating point, multicore), one change each.
2. A1 for the four labs whose models need a refusal first.
3. The owner decides S5; if strict, A2 one lesson at a time, starting with
   cache organization, which predicts two hidden cases and shows a third.

## Verification performed

At `99faf4e`, on 2026-11-28:

- `pnpm subject:report computer-architecture-execution`, Markdown and JSON; every
  flag read at its line.
- The full gate with the toolchain environment (`PLAYWRIGHT_PORT`,
  `LD_LIBRARY_PATH`, `ANVAYA_CC`, `ANVAYA_CC_ARM64`, binutils 2.46 on `PATH`):
  zero type errors, warnings or hints; formatting and lint passed; 485 tests in
  71 files, none skipped, including the native drift check; 42 pages; 154
  browser tests.
- `pnpm shots` on all 22 lessons, with report.json checked for overflow,
  offending elements and console errors; images opened for every figure this
  branch added or changed, at 1280 and 390 px in both themes.
- The contract cases of all 22 labs compared with each lesson's card 01
  (A2), and the seven models without refusal cases probed with invalid input
  (A1).

Not done: re-reading every cited page of the lessons this branch did not
change; a screen-reader or real-device check.
