---
title: Computer Architecture & Execution audit against the subject standard
status: draft
drafter: agent
auditDate: 2026-11-17
auditedCommit: 1142064
scope: subject
standard: docs/SUBJECT_STANDARD.md
---

# Computer Architecture & Execution audit

## Verdict

The subject meets the standard on everything that carries its weight. Every
lesson has real figures computed from tested models or recorded measurements.
Every lesson has an attempt lab whose starter fails, and a cross-check against
the reference. Every verified output a lesson displays is asserted by a test,
and all 28 native artifacts reproduce under the recorded compiler. No factual
error was found.

It is not quite clean. Its gaps are in how practice is staged, not in what it
teaches:

- In about ten lessons, the no-JavaScript static trace that follows a "predict,
  then step" widget gives the answer away in plain text.
- Five lessons have no predict moment before practice.
- Three labs have thin or revealed contracts.
- Thirteen of nineteen pages run past 30 minutes.

The last is partly a question about the standard rather than the lessons.
**P0 0, P1 1, P2 6, P3 6.**

## What is present

From `pnpm subject:report computer-architecture-execution`: 6 chapters, 19
lessons, no planned topics left. Lessons run 30–55 minutes (710 in total). The
inventory:

- 3–4 objectives and 3–5 interview questions per lesson;
- 57 imported figures and widgets, 52 of which read from `labs/`;
- 19 verified outputs in 18 lessons, all asserted line by line in lab tests;
- a lab for every lesson, with 2–9 hidden contract cases;
- 14 linked problems.

The report raised 53 flags; each was checked by hand below.

## Scores

| Group | ID  | Score   | Evidence or exceptions                                                                                                                                         |
| ----- | --- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C     | C1  | pass    | Every overview objective and competency maps to a lesson, including the multicore and measurement additions; experiments say which are owner-run.              |
| C     | C2  | pass    | The [path comment](../../src/content/paths/engineering-fundamentals.yaml#L70) and the earlier audit hand OS topics (locks, scheduling, page tables) onward.    |
| C     | C3  | pass    | Prerequisites form an order the path follows; representation precedes the CPU lesson as the earlier audit asked.                                               |
| C     | C4  | partial | 13 of 19 lessons over 30 minutes; memory and I/O at 55, stack at 50 (F2, Standard feedback S1).                                                                |
| C     | C5  | pass    | Calling convention, sign extension and coherence each have one home with links ([VERIFICATION.md](../VERIFICATION.md)); no duplicate planned titles.           |
| C     | C6  | pass    | `bump`, `sum_to` and `scale_sum` recur from CPU through compilation, assembly and stack; the locality and timing programs recur in performance.                |
| C     | C7  | pass    | The overview says the `perf stat` experiment has no recorded output.                                                                                           |
| C     | C8  | pass    | Six chapter sections; no `overview.chapters`.                                                                                                                  |
| L     | L1  | pass    | 3–4 objectives each; all drafts by `agent`.                                                                                                                    |
| L     | L2  | pass    | 3–5 questions each, answers state assumptions; four lessons have no follow-ups, which the standard allows.                                                     |
| L     | L3  | partial | 16 of 19 use "The analogy stops at"; stack and memory use other forms, multicore's analogy is in section 2, and memory and DRAM share one analogy (F9).        |
| L     | L4  | pass    | Every mechanism section is anchored by a figure (V1).                                                                                                          |
| L     | L5  | partial | No predict prompt before practice in five lessons (F3).                                                                                                        |
| L     | L6  | fail    | Answers in plain text after the prompt in about ten lessons (F1).                                                                                              |
| L     | L7  | pass    | A worked trace or calculation in all 19.                                                                                                                       |
| L     | L8  | pass    | Model boundaries are stated beside the figures ("teaching pipeline", "illustrative"), with diagnosis sections in compilation, I/O and stack.                   |
| L     | L9  | partial | The disclosure exists in all 19; reading-assembly shows no verified output (F7); nine lessons describe their tests differently or not at all (F13).            |
| L     | L10 | partial | Unnumbered or mixed cards in three lessons, non-"Practice" headings in four, and paper tasks carrying test commands in four (F4, F8).                          |
| L     | L11 | pass    | Exactly one three-option ConceptCheck per lesson, all explained (also asserted by `lessons.spec.ts`).                                                          |
| L     | L12 | pass    | 5–6 recap bullets each.                                                                                                                                        |
| L     | L13 | partial | Two stale links; multicore has no `/learn` links (F10).                                                                                                        |
| V     | V1  | pass    | Every lesson shows a `.diagram-frame` (asserted for all 19 in both projects).                                                                                  |
| V     | V2  | partial | `AmdahlBars` and `InstructionFields` hand-type values a tested model computes; `CachePlacement` recomputes inline (F6).                                        |
| V     | V3  | partial | `pnpm shots` on all 19 lessons: 251 captures, no overflow or console errors; the DRAM sweep's L3 label collides with its points at 390 px (F12).               |
| V     | V4  | pass    | Axe scans clean in both themes for all 19; twelve widget keyboard tests pass.                                                                                  |
| V     | V5  | pass    | Every lesson's figure, recap and disclosure work without JavaScript (asserted); steppers have static traces.                                                   |
| V     | V6  | pass    | Twelve widgets, each a manual stepper or explorer over a tested model.                                                                                         |
| V     | V7  | pass    | Illustrative parameters are labelled in captions and prose (for example the roofline machine and the instruction format).                                      |
| V     | V8  | pass    | `ArchitectureFlow` was retired; no unused diagram component remains.                                                                                           |
| E     | E1  | pass    | Every `?raw` import is from `labs/`.                                                                                                                           |
| E     | E2  | pass    | All 19 verified outputs appear line by line in lab tests.                                                                                                      |
| E     | E3  | pass    | The native runner reproduced all 28 artifacts with the recorded GCC 15.2 (x86-64 and aarch64).                                                                 |
| E     | E4  | pass    | Five measurements validated; tests assert only the prose's relationships (for example `stats.test.ts` on warm and cold runs).                                  |
| E     | E5  | pass    | WSL2, unpinned and frequency-uncontrolled limits are stated beside results.                                                                                    |
| E     | E6  | pass    | `perf-counters.sh` is owner-run, and its missing-`perf` exit is tested.                                                                                        |
| E     | E7  | pass    | No result found without a recording or test.                                                                                                                   |
| E     | E8  | pass    | Every citation matches a registered prefix (build); verification entries record pages opened.                                                                  |
| E     | E9  | pass    | The locality gap's cache explanation is labelled a hypothesis and listed for owner review.                                                                     |
| E     | E10 | pass    | The 2026-11-13 audit carries a dated correction.                                                                                                               |
| P     | P1  | partial | A lab for every lesson; three folders differ from their slugs and `measuring-performance` has no README (F11).                                                 |
| P     | P2  | partial | Memory has 2 cases, execution and binary 4 (F5).                                                                                                               |
| P     | P3  | pass    | All 19 starters throw `Implement your attempt`; the I/O refusal cases were fixed to fail first.                                                                |
| P     | P4  | pass    | Every lab runs its contracts against the reference in the gate; verification entries record independent checks (Python, real encoders, hand counts).           |
| P     | P5  | partial | Memory's card names both hidden inputs and its reveal gives both answers (F5).                                                                                 |
| P     | P6  | partial | Four READMEs are generic and do not state the contract (F11).                                                                                                  |
| P     | P7  | pass    | 14 problems, each applying its lesson; memberships verified from NeetCode's data; paid-only problems excluded.                                                 |
| W     | W1  | pass    | All drafts; no `reviewedAt`.                                                                                                                                   |
| W     | W2  | pass    | Every page was planned on the path before drafting.                                                                                                            |
| W     | W3  | pass    | One lesson per commit in PR #9.                                                                                                                                |
| W     | W4  | pass    | Commits add the lab and model with the lesson; prose reads values from them.                                                                                   |
| W     | W5  | partial | The gate ran before every commit, but PR #9's screenshot review used an uncommitted script and the cache lesson was captured in only two of four combinations. |
| W     | W6  | pass    | An entry per change from `8d6c08f` on.                                                                                                                         |
| W     | W7  | pass    | Conventional commits with bodies.                                                                                                                              |
| W     | W8  | pass    | The PR body and entries list items for owner review.                                                                                                           |
| W     | W9  | partial | Two stale links survived material moves (F10).                                                                                                                 |
| W     | W10 | pass    | Nothing pushed without approval.                                                                                                                               |

## Findings

### F1 · P1. Static traces and prompts give answers away before the attempt (L6)

A lesson asks the learner to predict before stepping a widget. The static
equivalent that the interactive playbook requires for readers without
JavaScript then follows in plain text, with the answer:

- [how-computers:104](../../src/content/lessons/computer-architecture-execution/how-computers-execute-programs.mdx#L104)
  → trace table at :110;
- [how-computers:143](../../src/content/lessons/computer-architecture-execution/how-computers-execute-programs.mdx#L143)
  → the answer at :155;
- [text-encoding:162](../../src/content/lessons/computer-architecture-execution/text-encoding-and-memory-layout.mdx#L162)
  → :167;
- [reading-assembly:183](../../src/content/lessons/computer-architecture-execution/reading-assembly.mdx#L183)
  → :187;
- [stack-and-heap:137](../../src/content/lessons/computer-architecture-execution/stack-and-heap.mdx#L137)
  → :142;
- [cache-organization:188](../../src/content/lessons/computer-architecture-execution/cache-organization.mdx#L188)
  → :193;
- [pipelining:113](../../src/content/lessons/computer-architecture-execution/pipelining-and-hazards.mdx#L113)
  → :119;
- [multicore:120](../../src/content/lessons/computer-architecture-execution/multicore-coherence-and-atomics.mdx#L120)
  → :124;
- [io-mechanisms:117](../../src/content/lessons/computer-architecture-execution/io-mechanisms.mdx#L117)
  → :122.

[cpu-registers:108](../../src/content/lessons/computer-architecture-execution/cpu-registers-and-instructions.mdx#L108)
asks "Predict:" and answers "No." in the same paragraph.

A learner sees the answer while scrolling to the widget, so the predict
moment does nothing. The fix keeps both rules: wrap each static trace in
`<details><summary>Check after stepping: the same trace without JavaScript</summary>`,
which works without JavaScript, and move cpu's answer into a "Check after
predicting" disclosure. One enhance-lesson change per lesson; no lab or figure
changes.

### F2 · P2. Thirteen pages exceed 30 minutes; three exceed 45 (C4)

| Minutes | Lessons                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 50–55   | memory-hierarchy-and-caches (55), io-mechanisms (55), stack-and-heap (50)                                                                                                |
| 40      | compilation-and-execution, cache-organization, hardware-software-interaction, architecture-and-performance                                                               |
| 35      | how-computers-execute-programs, cpu-registers-and-instructions, reading-assembly, dram-ssd-and-disks, branch-prediction-and-speculation, multicore-coherence-and-atomics |

The three over 45 are what ADR 0008 says to split. The 35–40 minute pages are
each one mechanism with a lab, so their length comes from practice, not from a
second unit. **Fix:** the owner decides between splitting and adjusting C4
(Standard feedback S1). If splitting, the candidates are memory (hierarchy and
locality / translation and AMAT), I/O (data movement and notification / request
lifecycle and cancellation) and stack (frames / heap lifetimes and failure
modes). Each split is a planning change, then one draft-lesson per page.

### F3 · P2. Five lessons have no predict moment before practice (L5)

The body of
[compilation-and-execution](../../src/content/lessons/computer-architecture-execution/compilation-and-execution.mdx),
[dram-ssd-and-disks](../../src/content/lessons/computer-architecture-execution/dram-ssd-and-disks.mdx),
[hardware-software-interaction](../../src/content/lessons/computer-architecture-execution/hardware-software-interaction.mdx),
[architecture-and-performance](../../src/content/lessons/computer-architecture-execution/architecture-and-performance.mdx)
and
[measuring-performance](../../src/content/lessons/computer-architecture-execution/measuring-performance.mdx)
asks for no prediction before the Practice cards. Each already has a natural
place for one:

- compilation: which symbol the linker must patch;
- DRAM: where the sweep's curve will step;
- hardware-software: which return address a fault resumes at;
- performance: which loop order is faster;
- measuring: whether the warm and cold ranges overlap.

**Fix:** add one prompt with a "Check after predicting" disclosure per lesson
(enhance-lesson).

### F4 · P2. Paper tasks carry test commands that do not test them (L10)

These cards describe written tasks but show `pnpm exec vitest run labs/…/`,
which runs the reference tests:

- [hardware-software:198](../../src/content/lessons/computer-architecture-execution/hardware-software-interaction.mdx#L198);
- [io-mechanisms:276](../../src/content/lessons/computer-architecture-execution/io-mechanisms.mdx#L276);
- [dram:254](../../src/content/lessons/computer-architecture-execution/dram-ssd-and-disks.mdx#L254);
- [architecture-and-performance:302](../../src/content/lessons/computer-architecture-execution/architecture-and-performance.mdx#L302).

`LabCard` requires a `command`, so the author had no way to write a paper task
without one. **Fix:** make `command` optional in `LabCard` (a small component
change with a browser test), then remove these four commands (Standard feedback
S2).

### F5 · P2. Thin or revealed contracts (P2, P5)

- The memory lab has two cases
  ([contracts.ts](../../labs/computer-architecture-execution/memory-hierarchy-and-caches/contracts.ts)).
  Its card at [:234](../../src/content/lessons/computer-architecture-execution/memory-hierarchy-and-caches.mdx#L234)
  names both inputs, and the disclosure at :241 gives both answers, so the
  hidden contracts add no independent evidence.
- `how-computers-execute-programs` and `binary-and-data-representation` have
  four cases each.

**Fix:** add hidden cases (boundary, conflict and invalid inputs) until each
has at least five, and change the memory card to name the contract, not its
cases (enhance-lesson's lab-case recipe).

### F6 · P2. Two figures hand-type values a tested model computes (V2)

- [`AmdahlBars`](../../src/components/diagrams/AmdahlBars.astro) writes 0.25,
  0.75, 0.1875 and 0.4375 as literals, while
  [`amdahl()`](../../labs/computer-architecture-execution/architecture-and-performance/example.ts#L25)
  is tested beside it.
- [`InstructionFields`](../../src/components/diagrams/InstructionFields.astro)
  hard-codes the fields of 0x2311, which the CPU lab decodes in a test.
- [`CachePlacement`](../../src/components/diagrams/CachePlacement.astro)
  recomputes tag, set and offset inline instead of importing the cache model.
  That one is lower risk.

**Fix:** import the model functions so the figures cannot drift (enhance-lesson's
diagram recipe).

### F7 · P2. Reading assembly shows its model without a verified output (L9, E2)

[reading-assembly:256](../../src/content/lessons/computer-architecture-execution/reading-assembly.mdx#L256)
shows the x86-64 interpreter in the tested model disclosure without `verified`
or `output`, and the lab has no `*Example()` function. It is the only lesson
whose disclosure shows no checked output. **Fix:** add an `x86Example()` that
prints the executed-instruction counts and results the tests already assert,
and display it as verified.

### F8 · P3. Card numbering and practice headings (L10)

- Unnumbered first cards: [how-computers:214](../../src/content/lessons/computer-architecture-execution/how-computers-execute-programs.mdx#L214),
  [memory:234](../../src/content/lessons/computer-architecture-execution/memory-hierarchy-and-caches.mdx#L234)
  and [cache:292](../../src/content/lessons/computer-architecture-execution/cache-organization.mdx#L292),
  which is followed by "02 /" and "03 /".
- Practice sits under descriptive headings in how-computers ("Attempt the
  control-flow contract"), memory ("Predict unfamiliar accesses"), cache
  ("Layout decides which sets you use") and stack ("Test lifetimes without
  inspecting the runtime").

**Fix:** number the cards, and add a `## Practice` heading or rename the
existing one.

### F9 · P3. Analogy limits not in the standard form, and one reused analogy (L3)

- [stack:89](../../src/content/lessons/computer-architecture-execution/stack-and-heap.mdx#L89)
  and [memory:86](../../src/content/lessons/computer-architecture-execution/memory-hierarchy-and-caches.mdx#L86)
  state their limits in other words.
- Multicore's analogy and limit are at [:117](../../src/content/lessons/computer-architecture-execution/multicore-coherence-and-atomics.mdx#L117),
  in section 2, not the hook.
- Memory (desk, shelf, warehouse) and DRAM (desk, shelf, library basement) use
  nearly the same analogy.

**Fix:** rephrase the limits, and give DRAM its own analogy.

### F10 · P3. Stale and missing links (L13, W9)

- [how-computers:196](../../src/content/lessons/computer-architecture-execution/how-computers-execute-programs.mdx#L196)
  says the performance lesson "works the latency, throughput and dependency
  timeline"; that now lives in `pipelining-and-hazards`.
- [compilation:214](../../src/content/lessons/computer-architecture-execution/compilation-and-execution.mdx#L214)
  says `bump` connects to "the CPU and stack lessons"; the stack lesson uses
  `scale_sum` and `sum_to`, not `bump`.
- Multicore has no `/learn` links, not even to its prerequisites or to the
  operating systems subject it mentions at :279.

**Fix:** correct both sentences and add the links.

### F11 · P3. Lab housekeeping (P1, P6)

- `labs/…/branch-prediction`, `simd` and `multicore` differ from their lesson
  slugs.
- `measuring-performance` has no README.
- The READMEs for binary, how-computers, memory and cache are generic and do
  not state the contract.

**Fix:** write the missing README and the contract paragraphs. Renaming the
three folders touches lesson imports, components and the native runner's
manifest; do it only if the owner wants the convention enforced (Standard
feedback S4).

### F12 · P3. One label collision at 390 px (V3)

In the [DRAM sweep chart](../../src/components/diagrams/WorkingSetSweep.astro),
the vertical "L3 24 MiB" label overlaps the measured points at 390 px in both
themes. **Fix:** move the cache-size labels into a key below the chart at
narrow widths, as was done for the roofline.

### F13 · P3. Nine lessons do not say what their tests check (L9)

How-computers, CPU, reading-assembly, compilation, stack, memory,
hardware-software, I/O and architecture-and-performance have no paragraph
after the disclosure that says what the tests assert. The other ten do.
**Fix:** add one sentence each.

## Factual errors

None found. Checks: every lab and model test passes; the native runner
reproduces all 28 artifacts; all verified outputs are asserted; the
measurement tests assert the prose's statements. Prose claims were not
re-checked against every cited page in this audit; PR #9's verification
entries record the pages opened when each lesson was drafted.

## Report flags that are not findings

- **L6** at branch-prediction:90 ("Instead they **predict** each branch") and
  memory:185 ("…to predict whole-program time") are prose, not prompts.
- **V2** on `SpectreSteps` and `MeasureWorkflow`: concept figures with no
  values to compute.
- **L6 false negatives:** the report missed the cache, text-encoding, stack,
  multicore and I/O reveals in F1, because a widget sits between the prompt and
  the answer. The report should look past the widget (tool change, not a
  standard change).

## Standard feedback

- **S1 (C4, owner's decision).** The reference subject runs past the 15–30
  minute rule in 13 of 19 pages. Most of those are one unit with substantial
  practice. Options:
  - (a) keep C4 and split; at least the three pages over 45 minutes, possibly
    all thirteen;
  - (b) keep 15–30 as the target, accept 31–45 for a page that is one unit, and
    require a split above 45.

  The agent recommends (b), and splitting the three pages over 45.

- **S2 (L10).** "A paper task does not carry a test command" cannot be met
  while `LabCard` requires `command`. Make it optional, as F4 proposes.
- **S3 (L9).** The exact phrase "The tests check" is a useful convention, but
  the property is that the lesson says what its tests assert. Keep the phrase
  in templates; accept equivalent wording.
- **S4 (P1).** Requiring lab folders to match slugs is cheap for new subjects
  but costly to retrofit here. Accept documented exceptions for existing labs,
  or rename them.

## Recommended sequence

1. F1 and F13, one enhance-lesson change per lesson, about ten lessons.
2. The owner decides S1 and S2. Then the `LabCard` change (F4), and the splits
   (F2) as a planning change.
3. F3, F5, F6 and F7, one change per lesson.
4. P3 housekeeping (F8–F12), batched by lesson.

## Verification performed

On 2026-11-17 at `1142064`:

- `pnpm subject:report computer-architecture-execution` (Markdown and JSON).
- The full gate with the toolchain environment, run before the previous
  commit: 415 tests in 65 files, including every lab and the native drift
  check; 39 pages; 104 browser tests, including `lessons.spec.ts` on all 19
  lessons.
- The native runner on its own: 28 artifacts unchanged, 8 programs, 5
  measurements.
- `pnpm shots` on all 19 lessons (251 captures, no overflow or console
  errors). Opened: cache placement and the cache explorer, the DRAM sweep at
  390 px, and false sharing at 390 px.
- Every flag and finding was read at the cited lines.

Not done: re-reading every cited source page; opening all 251 captures; a
screen-reader or real-device check.
