---
name: create-subject
description: Plan and build a new Anvaya subject to docs/SUBJECT_STANDARD.md. Interviews the owner first, researches and proposes a full outline (chapters, lessons, labs, visuals, problems), waits for approval, then drafts lesson by lesson with checkpoints. Use when the owner wants to start, plan or outline a subject, or fill an outline-only subject with lessons.
---

# Create a subject

You plan a subject with the owner, then build it one lesson at a time. The bar
is [docs/SUBJECT_STANDARD.md](../../../docs/SUBJECT_STANDARD.md); the reference
subject is Computer Architecture & Execution. Change nothing in the repository
until the owner has answered the intake and approved the outline.

## Phase 1: Intake (ask; change nothing)

Ask the questions in [intake.md](intake.md), in the batches it gives. Use the
host's question tool if there is one; otherwise ask in chat. Wait for answers.
Read back a one-paragraph summary and let the owner correct it.

## Phase 2: Survey and research

1. Run `pnpm subject:report <subject>` and read the subject YAML, its path
   section and overview, the outlines of neighbouring subjects (for boundaries
   and duplicates, C2 and C5) and `src/content/sources/`.
2. If an audit of the subject exists in `docs/reviews/`, start from its findings.
3. Open the candidate sources: official documentation, textbooks, courses and
   specifications the owner trusts or that are already registered. Note the
   exact pages that would support each lesson. Do not register anything yet.
4. Check which toolchains and tools actually run here (compilers, databases,
   packet tools, `perf`). Plan owner-run scripts for those that cannot.

## Phase 3: Propose

Write `docs/proposals/<subject>.md` from [outline-template.md](outline-template.md):
scope and boundary, a coverage map, chapters in prerequisite order with one
teaching unit per page, and for every lesson its objectives, figures and what
computes them, attempt lab contract, native evidence, interview themes, genuine
problems and sources. Run `pnpm verify` and commit the proposal on its own
(`docs(proposals): propose the <subject> curriculum`).

**Stop.** Present the outline: chapter and lesson count, total minutes,
decisions that are the owner's, and what you could not verify. Wait for
approval, edits or reordering. Revise and ask again until approved.

## Phase 4: Planning change

After approval, make one change with
[add-subject-or-path.md](../../../docs/playbooks/add-subject-or-path.md):
replace the subject's section with chapter sections whose `planned` lists are
the approved page titles, remove `overview.chapters`, align the overview (C7),
register the sources the outline needs ([add-source.md](../../../docs/playbooks/add-source.md)),
and add the native lab skeleton if there is one. Verify, record and commit
([verify-change.md](../../../docs/playbooks/verify-change.md)).

## Phase 5: Draft with checkpoints

For each planned page, in outline order, run the
[draft-lesson](../draft-lesson/SKILL.md) skill: one lesson, one commit.

- **After every lesson:** report what was drafted, verified and flagged, the
  time spent, and the next lesson. Ask: continue, stop, reorder or redirect.
  Follow the answer; if there is none, stop.
- **After every chapter:** run [audit-subject](../audit-subject/SKILL.md) on that
  chapter, fix what is P0 or P1 before moving on, and show the owner the rest.
- If drafting shows the outline was wrong (a page is two units, a topic belongs
  elsewhere), stop and propose the change as a planning change; do not drift.

Never push or open a pull request without the owner's approval.
