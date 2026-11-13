---
title: Computer Architecture & Execution curriculum audit
status: draft
drafter: agent
auditDate: 2026-11-13
auditedCommit: d40a5b7
---

# Computer Architecture & Execution curriculum audit

## Verdict and scope

The nine approved topics are all represented. The subject is a sound conceptual
introduction, with careful explanations of several commonly confused ideas.
It is **not yet comprehensively taught and assessed against its own intended
outcomes**. The main gaps are concrete machine-level examples, practical
evidence, visual explanations, and independent learner assessment. Adding more
chapter titles would not address those gaps.

Keep the nine-lesson structure. Strengthen and shorten the existing lessons,
using a small running program and mechanism diagrams to connect them. No
blocking factual error was identified in this audit; the findings below concern
depth, teaching sequence, presentation, and the evidence behind learning outcomes.

The boundary comes from the repository: [the subject describes hardware as a
software cost model](../../src/content/subjects/computer-architecture-execution.yaml#L43),
and [the path targets experienced software engineers](../../src/content/paths/engineering-fundamentals.yaml#L7).
A full electronics, HDL, or processor-construction curriculum is a separate
scope. MIT's [simple-processor walkthrough](https://computationstructures.org/lectures/beta/beta.html)
is useful evidence for a compact datapath explanation; its circuit-building
coursework need not become an Anvaya requirement.

This report audits the current files, all nine lab implementations and their
tests, learning standards, path order, overview outcomes, and registered primary
references. Source line anchors refer to commit `d40a5b7`. It proposes revisions;
it does not change lesson content or promote any draft.

## What is present

| Inventory                         | Observed state                                                        |
| --------------------------------- | --------------------------------------------------------------------- |
| Approved topics and draft lessons | 9 of 9 topic headings represented                                     |
| Tested examples                   | 9 TypeScript models; 18 implementation/test files                     |
| Practice                          | 27 exercise prompts, 9 concept checks, 41 interview questions         |
| External problems                 | 3 relevant bit-representation problems with verified metadata         |
| Mechanism diagrams or images      | 0; shared UI icons are not counted                                    |
| Other visual material             | 11 Markdown tables, including useful state/access traces              |
| Displayed source                  | 575 lines across 9 complete lab files; 37–90 lines per lesson         |
| Time metadata                     | 440 minutes in total; authoring estimates, not measured learner times |

Individual prose paragraphs are generally short. The reading burden comes from
continuous exposition, repeated explanations, and full source listings. Replacing
those with useful figures is more valuable than inserting decorative images
between the same paragraphs.

The current strengths should survive revision: integer overflow versus language
rules; local cache miss rates; TLB misses versus page faults; coherence versus
atomicity; DMA completion versus ownership; and model estimates versus measured
results. These distinctions provide useful engineering judgment.

## Coverage of each approved topic

“Partial” means a mechanism or application needs a worked example or assessment;
it does not mean the entire topic is absent. These are editorial judgments, not
a numerical coverage score.

| Lesson                                                                                                                             | Current coverage                                                                                                                                                                                                 | Smallest useful improvement                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Program execution](../../src/content/lessons/computer-architecture-execution/how-computers-execute-programs.mdx#L79)              | State, PC, branching, process/execution distinctions, and dynamic instruction count are taught clearly. The accumulator trace has no data-memory operation.                                                      | Show PC, decoder/control, registers, ALU, and instruction/data memory in one diagram. Trace a load, arithmetic operation, and store alongside the existing branch example.                                                                         |
| [CPU, registers, instructions](../../src/content/lessons/computer-architecture-execution/cpu-registers-and-instructions.mdx#L85)   | ISA versus implementation and operand forms are clear. Applied coverage is partial: the two invented instruction encodings are decoded but not executed.                                                         | Add one concrete ISA trace with an effective address, register/memory changes, operand width, and a call/return. Explain instruction width, data width, address width, and sign/zero extension together.                                           |
| [Compilation and execution](../../src/content/lessons/computer-architecture-execution/compilation-and-execution.mdx#L92)           | Build stages, symbol resolution, relocation, loading, optimization, and JIT are explained. Only toy numeric relocation is demonstrated.                                                                          | Reuse the concrete program to show actual source, object/symbol information, executable, and compiler output at two optimization settings. Include one build-boundary diagnosis.                                                                   |
| [Binary and data representation](../../src/content/lessons/computer-architecture-execution/binary-and-data-representation.mdx#L96) | Integers, overflow, endianness, padding, and text units are strong. Floating point is qualitative; its bit encoding is not worked.                                                                               | Add sign extension and a small floating-point field/spacing example, using tested byte inspection. Replace a duplicated integer exercise with a text-counting or float-decoding task.                                                              |
| [Memory hierarchy and caches](../../src/content/lessons/computer-architecture-execution/memory-hierarchy-and-caches.mdx#L112)      | Direct mapping, locality, cold/conflict misses, AMAT, and translation/fault distinctions are well explained. Associativity and writes receive brief treatment; hierarchy technology and prefetching remain thin. | Add a hierarchy figure, tag/index/offset mapping, and one two-way comparison using the existing conflict example. Explain SRAM/cache, DRAM/RAM, and persistent storage at a qualitative software-cost level. Add one address-stream/locality task. |
| [Stack and heap](../../src/content/lessons/computer-architecture-execution/stack-and-heap.mdx#L95)                                 | Lifetimes, ownership, stack limits, fragmentation, and tracing GC are covered. The model accounts for bytes without demonstrating real saved state or return addresses.                                          | Show nested frames, a return location, preserved state, and a reference to a surviving allocation. Reuse the concrete call example; keep allocator and GC implementation detail optional.                                                          |
| [Hardware/software interaction](../../src/content/lessons/computer-architecture-execution/hardware-software-interaction.mdx#L98)   | Privilege, syscall/fault/interrupt differences, MMIO, and device address domains are sound. Coherence/ordering are explained, while MESI and store buffers are mostly named.                                     | Visualize protected entry and resumption. Add one brief ownership/visibility scenario if MESI/store-buffer understanding remains an explicit overview expectation. Full protocol simulation is unnecessary here.                                   |
| [I/O mechanisms](../../src/content/lessons/computer-architecture-execution/io-mechanisms.mdx#L88)                                  | Core software-facing fundamentals are sufficient: movement versus notification, buffer ownership, cancellation caveats, short results, and durability boundaries.                                                | Replace repeated lifecycle prose with a driver/device/host swimlane. Preserve its accurate qualifications. More device families would add breadth without closing an essential gap.                                                                |
| [Architecture and performance](../../src/content/lessons/computer-architecture-execution/architecture-and-performance.mdx#L119)    | CPU-time and Amdahl arithmetic are good. Pipelines, hazards, speculation, SIMD, and false sharing are mainly descriptive. Real profiling competence is not exercised.                                            | Work one dependency/stall/branch timeline and one reproducible locality experiment. Teach interpretation of noisy, null, or contrary results as well as improvements.                                                                              |

## Findings to resolve before claiming comprehensive coverage

### 1. Connect the abstractions to one real program

The overview expects learners to [read assembly and explain a measured performance
difference](../../src/content/subjects/computer-architecture-execution.yaml#L112).
The compilation lesson explicitly says it [does not run a native build or inspect
compiler output](../../src/content/lessons/computer-architecture-execution/compilation-and-execution.mdx#L202),
and the performance lab explicitly [measures no processor timings or counters](../../src/content/lessons/computer-architecture-execution/architecture-and-performance.mdx#L203).
Those are honest model boundaries, but the course currently lacks the practical
bridge to those intended competencies.

Use two shared practical threads:

1. **Source to machine behavior:** one small program, one documented target/ABI,
   actual compiler artifacts, a load/compute/store sequence, and one call/return.
   Reuse it in execution, CPU, compilation, and stack explanations. MIT's
   [ISA walkthrough](https://computationstructures.org/lectures/isa/isa.html) and
   [procedure explanation](https://computationstructures.org/lectures/stacks/stacks.html)
   support this level of mechanism teaching.
2. **One locality measurement:** compare equivalent correct work under two access
   patterns, record toolchain/machine/input details, repeat runs, and discuss the
   observation separately from its proposed cause. Counter interpretation can
   extend this where supported. [Dive into Systems connects layout, locality,
   and performance observation](https://diveintosystems.org/book/C11-MemHierarchy/index.html).

The overview's six [experiment ideas](../../src/content/subjects/computer-architecture-execution.yaml#L88)
are proposed investigations, not six mandatory projects. False-sharing and branch
experiments can remain optional extensions. Native work is already in the
approved subject scope; choosing and documenting a reproducible toolchain is an
implementation decision, not an extra approval rule. Every displayed code or
assembly artifact must come from tested files in `labs/`; measured claims must
come from actual runs. Benchmark tests should check correctness, not assert a
universal speedup.

### 2. Make the remaining fundamentals visible and worked

The important additions fit inside current lessons:

- **Machine organization:** show what the PC, control/decoder, register file,
  ALU, memory, and clocked state do. A labelled block diagram is enough; gate
  design is not required.
- **Widths and addresses:** distinguish instruction bits, operand bits, byte
  addresses, and register-held pointers. Work one address calculation and one
  sign/zero-extension example.
- **Floating point:** show sign/exponent/fraction, reconstruct one exactly
  representable value, and show how spacing changes with magnitude. A tested
  `DataView` example can inspect representation in the existing TypeScript
  setup. Full IEEE arithmetic circuitry would exceed this foundation.
- **Caches:** expose tag/index/offset and why associativity changes the same
  conflict trace. Show write-back/prefetching as bounded mechanisms rather than
  adding another broad cache chapter. MIT's [memory-hierarchy walkthrough](https://computationstructures.org/lectures/caches/caches.html)
  is a useful reference for these relationships.
- **Pipelines:** work a dependency and a branch in a stage-by-cycle grid, with
  the assumed stages and forwarding policy stated. MIT's [pipelined processor
  walkthrough](https://computationstructures.org/lectures/pbeta/pbeta.html)
  provides the relevant mechanism; a full out-of-order core design is optional.
- **Coherence and ordering:** retain the current careful distinctions. One short
  per-line ownership or cross-location visibility scenario is sufficient at this
  level; naming all MESI states is not equivalent to teaching their use.

### 3. Assess the learner's attempt separately from the reference model

All nine labs contain only `example.ts` and `example.test.ts`. Their displayed
commands run already-complete examples. That establishes reference correctness,
while the [learning standard asks for starter tests checking the attempt](../LEARNING_STANDARDS.md#L11).
The existing [attempt-test configuration](../../vitest.labs.config.ts#L4) and
lab templates already support that distinction.

Several exercises also repeat answers in shipped tests. For example, the
[representation exercise for bytes 128 and 255](../../src/content/lessons/computer-architecture-execution/binary-and-data-representation.mdx#L234)
is already answered by [the reference test](../../labs/computer-architecture-execution/binary-and-data-representation/example.test.ts#L25).
The invalid-field CPU exercise, protected-context hardware exercise, and I/O
failure/reclaim exercise have similar overlap. They can still support practice,
but provide weak independent evidence of transfer.

Add small attempt/contract exercises for selected core operations, such as one
execution step, a representation conversion, and a cache decision. Give paper
tasks incomplete traces, an unfamiliar case, and clear answer criteria. Replace
duplicated exercises rather than increase the exercise count. In particular:

- Match the text-unit objective to a byte/code-unit/code-point/grapheme task.
- Diagnose a faulty instruction or cache trace instead of copying the worked one.
- Classify a TLB miss, data-cache miss, and page fault from short scenarios.
- Predict a pipeline stall or evaluate evidence from an actual measurement.

The three external bit problems remain relevant and their metadata was freshly
checked. Unrelated interview-bank problems would pad the other lessons. A single
strong transfer question is more useful than increasing the current 41 oral
questions or nine quizzes just to raise counts.

### 4. Put prerequisite ideas before the decoding exercise

The CPU lesson uses [hexadecimal fields and bit masks](../../src/content/lessons/computer-architecture-execution/cpu-registers-and-instructions.mdx#L108)
before the later binary lesson teaches [positional weights](../../src/content/lessons/computer-architecture-execution/binary-and-data-representation.mdx#L96)
and [masks](../../src/content/lessons/computer-architecture-execution/binary-and-data-representation.mdx#L137).
This is manageable for an experienced reader, but weakens a self-contained
fundamentals path.

Prefer execution → representation → CPU → compilation → memory → stack/heap →
hardware/software → I/O → performance. Update prerequisites together so moving
representation earlier does not create a cycle; its current CPU back-reference
would also need a short edit. A small prerequisite primer is an alternative if
the existing order is retained. Avoid duplicating a whole binary introduction.

## Visual replacement plan

These are mechanism briefs, not a quota for separate assets. Related panels can
share a figure. Each figure should replace the specified explanation or table,
with a short text equivalent retained.

| Lesson            | Figure and teaching conclusion                                                                                                                                            | Material to shorten or move                                                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Execution         | PC → instruction → decoder/control → registers/ALU → state update, with the existing taken/untaken branch snapshots. Label its illustrative instruction-index convention. | [Four-step explanation and trace prose](../../src/content/lessons/computer-architecture-execution/how-computers-execute-programs.mdx#L86); full implementation becomes optional.                                                                                              |
| CPU               | A bit-field strip for `0x2311`, labelled 4/4/8 bits and 2/3/17; connect a register/address/value inset to the real load/store example.                                    | [Field table and repeated field-budget prose](../../src/content/lessons/computer-architecture-execution/cpu-registers-and-instructions.mdx#L108).                                                                                                                             |
| Compilation       | Artefact pipeline with actions on arrows, plus two object modules whose unresolved `helper` becomes address 102. Connect to the real compiler artifacts.                  | [Two build/layout tables and repeated relocation explanation](../../src/content/lessons/computer-architecture-execution/compilation-and-execution.mdx#L92); retain error diagnosis.                                                                                           |
| Representation    | Separate small panels for signed/unsigned interpretation, carry versus overflow, endian byte lanes, labelled padding, and the added floating-point example.               | [Integer interpretation](../../src/content/lessons/computer-architecture-execution/binary-and-data-representation.mdx#L96) and [layout prose](../../src/content/lessons/computer-architecture-execution/binary-and-data-representation.mdx#L175); avoid one oversized poster. |
| Memory            | Hierarchy strip and two-slot cache snapshots showing block 2 evicting block 0 while slot 1 stays unused. Add address fields and the two-way alternative.                  | [Access table and mapping prose](../../src/content/lessons/computer-architecture-execution/memory-hierarchy-and-caches.mdx#L112); retain the distinct AMAT calculation.                                                                                                       |
| Stack/heap        | Before call, during call, and after return, with symbolic frame contents and a reference arrow to an allocation that survives the frame.                                  | [Lifetime table and explanation](../../src/content/lessons/computer-architecture-execution/stack-and-heap.mdx#L124); avoid a universal “stack down, heap up” memory picture.                                                                                                  |
| Hardware/software | User/kernel boundary with ordinary call, syscall, restartable fault, and interrupt paths; show saved return locations under stated conventions.                           | [Event table, entry list, and return-location explanation](../../src/content/lessons/computer-architecture-execution/hardware-software-interaction.mdx#L98).                                                                                                                  |
| I/O               | Driver/device/host swimlane: submission, payload transfer, notification, completion, reclamation. A timeout must not directly return ownership.                           | [Lifecycle list and repeated ownership prose](../../src/content/lessons/computer-architecture-execution/io-mechanisms.mdx#L112); retain movement-versus-notification comparison.                                                                                              |
| Performance       | Ideal versus stalled pipeline timeline; compact Amdahl time bars showing 1 becoming 0.4375 for the existing model example.                                                | [Overlap explanation](../../src/content/lessons/computer-architecture-execution/architecture-and-performance.mdx#L119) and [Amdahl prose](../../src/content/lessons/computer-architecture-execution/architecture-and-performance.mdx#L175); retain experiment design.         |

Use the existing `DiagramFrame`, local Astro/SVG/HTML, and design tokens. These
are precise diagrams of bits, addresses, and state; decorative chip photographs
would contribute little. Create original figures rather than copy source-book
illustrations.

Give SVGs titles/descriptions, label arrows and states, and use colour only as
a secondary cue. Reflow panels vertically on phones. Keep text equivalents,
working navigation, and native disclosures without JavaScript. Figure values
should agree with the tested models; distinguish illustrative pipeline timing
from measured timing.

Static figures are the first step. A manual-step cache trace is a useful later
interactive candidate because the tested cache model already exists. Branch/PC
stepping may also help. Interactivity should earn its cost by revealing state
changes, retain a static trace, and follow the keyboard/live-feedback rules in
[the interactive playbook](../playbooks/add-interactive.md). Nine new interactive
widgets are unnecessary.

## Curation and size control

Use this primary reading flow:

**Concrete problem → mechanism figure → short worked trace → assumptions and
pitfall → attempt-first practice → reasoning check → recap.**

Keep full tested code imported with `?raw`, but place it in an optional native
`details` disclosure. The learner should understand the mechanism without
reading dozens of validation branches. Any shorter displayed source must still
come from tested lab files. Preserve complete lab access and source provenance.

| Repetition                                                           | Single teaching home                                                                                                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calling convention and preserved registers: CPU, stack, hardware     | Define briefly in CPU; show frame effects in stack; teach the syscall-specific contract in hardware.                                                 |
| Pipeline preview in execution and detailed discussion in performance | Keep execution's preview short; put the worked schedule in performance.                                                                              |
| TypeScript map/set/byte-accounting complexity                        | Move simulator implementation costs into optional lab notes. Main reading explains architectural costs with assumptions.                             |
| Model limitations and language distinctions                          | State each model's boundary precisely near its figure/code; cross-link the full explanation instead of repeating paragraphs.                         |
| Separate analogies and toy machines                                  | Reuse one concrete program/data story and consistent labels; retain analogies that clarify a particular concept. Do not build a monolithic emulator. |

Do not add full gate/CMOS design, HDL, complete CPU construction, ISA catalogs,
microcode/ROB implementation, NUMA, formal weak-memory proofs, advanced cache
protocols, or storage-controller internals to close these foundation gaps.
Detailed scheduling, page-table algorithms, filesystems, and runtime internals
already have a home in the planned OS/runtime subject. Keep only the hardware
boundary needed here and link onward.

The [“Future chapters / not yet written” grouping label](../../src/components/catalog/SubjectOverview.astro#L177)
also deserves a small copy clarification once the subject is revised, so a
suggested grouping is distinguishable from the current available lessons.

## Bounded revision sequence and acceptance

1. Map each objective to one explanation, worked example, and independently
   assessable task. Correct the representation prerequisite order.
2. Introduce the running machine/program trace and highest-value figures:
   execution, instruction fields, cache mapping, stack lifetimes, and pipelines.
   Revise one lesson per change, removing displaced prose/source from its main flow.
3. Complete the remaining representation, compilation, privilege, and I/O figures
   and the compact worked fundamentals. Add selected learner attempt contracts.
4. Supply the real compiler/assembly thread and one locality measurement, reusing
   them across lessons. Leave other proposed experiments as clear extensions.
5. Repeat content review and technical/browser verification. Check diagram labels
   at mobile widths in both themes, with keyboard and JavaScript disabled.

Call the curated foundation complete when every advertised core outcome has a
worked demonstration and a meaningful attempt task; important mechanisms can be
explained from figures; the practical bridge includes actual artifacts and
observations; and duplicated narrative has been replaced rather than expanded.
Test totals and topic counts alone are not those acceptance criteria. Promotion
still requires the owner's independent practice and pedagogical review;
automated checks cannot establish learner mastery.

## Verification performed for this audit

On 2026-11-13, `pnpm lint` passed. A fresh full run also passed:

```sh
PLAYWRIGHT_PORT=4331 \
  LD_LIBRARY_PATH=/tmp/anvaya-browser-deps/usr/lib/x86_64-linux-gnu \
  pnpm verify
```

The run completed type checks with zero errors/warnings/hints, formatting, lint,
151 tests in 17 files, the 29-page build and link validation, the 22-page search
index, and all 36 desktop/mobile browser tests. The temporary library directory
is the local setup documented in [the earlier verification record](../VERIFICATION.md#computer-architecture--execution-drafts--2026-11-12).

The three external problem pages and published membership metadata were freshly
checked. The visual audit inspected source and existing screenshots; it did not
implement new illustrations or run a new 76-scan lesson audit. No new native
compiler experiment, hardware-counter run, benchmark result, or learner-mastery
claim is made. All lessons remain agent drafts.

## Implementation follow-through — 2026-11-13

The owner requested execution of this plan after the baseline audit. The nine
existing lessons have now been revised in separate local commits: primary
mechanism figures, optional full source, corrected prerequisite order, stronger
worked mechanisms and diagnosis tasks, three learner attempt/contract paths,
tested native compiler artifacts, and a recorded locality experiment. The
original findings above describe commit `d40a5b7`, not the revised lesson state.

The [revision verification record](../VERIFICATION.md) records the executed
checks, actual measurement provenance, browser coverage, and remaining limits.
The native-enabled quality gate passed 164 unit/lab tests and 56 browser tests.
Content remains draft; owner promotion and independent pedagogical review are
still required.
