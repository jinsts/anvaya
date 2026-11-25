---
name: draft-lesson
description: Draft one Anvaya lesson with its attempt lab, tested model, figures and verification record to docs/SUBJECT_STANDARD.md, then commit it alone. Use for a topic planned in a path on main or a lesson the owner requested, including when create-subject drafts its outline.
---

# Draft a lesson

One lesson, one commit. The procedure is
[docs/playbooks/add-lesson.md](../../../docs/playbooks/add-lesson.md); the bar
is [docs/SUBJECT_STANDARD.md](../../../docs/SUBJECT_STANDARD.md). This skill adds
the order of work, the stops and the report.

## Before writing

1. Confirm the topic is planned on main or requested by the owner (W2). If it
   holds more than one mechanism, stop and propose a split instead.
2. Read the prerequisite and next lessons, the subject's proposal in
   `docs/proposals/` if there is one, and its native lab README if there is one.
3. Plan in your scratch notes: the mechanism, objectives, hook and analogy,
   figures and what computes them, worked example, the lab contract and its
   independent cross-check, interview themes, sources and candidate problems.
   If the owner asked to see plans first, show this and wait.

## Build, in this order

1. `pnpm new:lesson <subject>/<slug> --title "…" --path <path>`; move the topic
   from `planned` to `lessons`.
2. Lab: model and tests with an `*Example()` output → contracts (≥5 hidden
   cases) → `practice.test.ts` → independent cross-check → README. Confirm
   `pnpm lab <subject>/<slug>` fails every case.
3. Native evidence, if the subject has a toolchain: add to the native runner,
   record with provenance, test only what the prose will claim.
4. Figures and widgets that import the model or recorded files
   ([add-interactive.md](../../../docs/playbooks/add-interactive.md)).
5. The lesson body and frontmatter, in the anatomy order of add-lesson.md.
6. Sources (open every page) and genuine problems only.
7. Neighbours: cross-links, overview, path comments, hard-coded test lists.

## Check, record, commit

1. Work through [checklist.md](checklist.md).
2. Follow [verify-change.md](../../../docs/playbooks/verify-change.md): full
   gate with the toolchain environment, `pnpm shots` review of every figure and
   widget state, a `docs/VERIFICATION.md` entry.
3. Commit only this lesson: `feat(content): draft the <topic> lesson`.

## Report

End with: what the lesson teaches, the evidence behind it (tests, cross-checks,
recordings), the commands run and their results, what review of the
screenshots changed, and a separate list of claims, hypotheses and judgment
calls for the owner. If any check could not run, say so plainly. Never push.
