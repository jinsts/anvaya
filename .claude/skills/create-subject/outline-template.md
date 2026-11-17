# Outline proposal template

Copy this structure into `docs/proposals/<subject>.md`. Keep it scannable:
tables over paragraphs. Every claim about a source names a page you opened.
IDs refer to [docs/SUBJECT_STANDARD.md](../../../docs/SUBJECT_STANDARD.md).

```markdown
---
title: <Subject> curriculum proposal
status: draft
drafter: agent
proposedDate: YYYY-MM-DD
basedOnCommit: <short hash>
---

# <Subject> curriculum proposal

## Intake

The owner's answers, one line each: goals, level, roles and interviews, depth,
languages and toolchains, hardware and tools, exclusions, trusted sources,
time budget, checkpoints.

## Scope and boundary (C2)

What the subject teaches, in two or three sentences. Then a table of excluded or
neighbouring topics and the subject that owns each (or "out of scope").

## Coverage map (C1)

| Competency or interview deep dive | Lesson that teaches it | Lab or practice that assesses it |

Every row of the subject overview's objectives and competencies, and every
common interview topic at the target level, appears here.

## Running threads (C6)

The concrete programs, datasets or scenarios reused across lessons, and which
lessons use each.

## Toolchain and evidence plan (E3–E6)

What runs in `pnpm verify` (TypeScript models), what runs in a native lab with
recorded, drift-checked artifacts (toolchain, version, env variable, setup
script), what is measured and how, and what is owner-run.

## Chapters and lessons

One section per chapter, in prerequisite order (C3). For each lesson:

### <n>. <Title: hook> (`<subject>/<slug>`, ~<minutes> min, <difficulty>)

- **Teaching unit (C4):** the one mechanism this page owns.
- **Prerequisites:** lesson IDs, including other subjects'.
- **Objectives (L1):** 2–4 demonstrable outcomes.
- **Hook and analogy (L3):** the scenario, the analogy and where it stops.
- **Figures (V1, V2):** each figure or widget, its kind (diagram, stepper,
  chart, timeline) and the model or recorded artifact that computes it.
- **Worked example (L7):** the concrete trace or calculation.
- **Attempt lab (P1–P5):** the `solve` contract in one sentence, the kinds of
  hidden cases, and the independent cross-check.
- **Evidence:** native programs, listings or measurements, if any.
- **Interview themes (L2):** 3–6 questions in brief.
- **Problems (P7):** candidates that genuinely apply, with what was checked,
  or "none fits".
- **Sources (E8):** pages, marked registered or to register.

## Duplication check (C5)

Concepts that neighbouring lessons or subjects also mention, and which page is
their single teaching home.

## Totals and drafting order

Chapters, lessons, total minutes, and the order of drafting with checkpoints.

## Decisions for the owner

Open choices only the owner can make, each with a recommendation.

## Risks and unverified claims (E7, E9)

What could not be checked, tools that are unavailable here, sources not yet
opened, and assumptions that need the owner's review.
```

Size each lesson at 15–30 minutes of reading and attempting. If a topic needs
more, split it into pages now rather than later.
