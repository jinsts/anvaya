---
name: enhance-lesson
description: Improve an existing Anvaya lesson while the owner studies it, by adding a point, diagram, worked example, lab case, problem, interview question or source, without breaking its tests, sources or flow. Also brings legacy lessons up to docs/SUBJECT_STANDARD.md. Use when the owner asks to add to, clarify, fix or extend a lesson.
---

# Enhance a lesson

Small, deliberate changes to one lesson. The owner is studying it, so their
question or confusion is the reason for the change. The bar is
[docs/SUBJECT_STANDARD.md](../../../docs/SUBJECT_STANDARD.md).

## 1. Understand the request

Restate what the owner wants added and why: what confused them, or what they
want to practise. If the request is ambiguous ("explain caches better"), ask
one clarifying question before changing anything.

## 2. Read before touching

- The lesson, its lab (model, tests, contracts, README), the components it
  imports, and the e2e and unit tests that cover them.
- Its `docs/VERIFICATION.md` entries and `git log --follow` on the lesson,
  which record why it is shaped the way it is.
- `pnpm subject:report <subject>/<slug>` for its current counts and flags.
- The prerequisite and next lessons, to find the single teaching home (C5).

## 3. Decide where it belongs

- If the material belongs in another lesson, enhance that one and link to it.
- If it would push the lesson past about 30 minutes, or adds a second
  mechanism, propose a split as a planning change instead.
- If it changes a claim, find the test or recording that will back it first.

## 4. Make the change

Follow the matching recipe in [recipes.md](recipes.md). Each recipe lists
everything else that must move with it, such as figures, contracts, recap,
concept check, minutes and test lists. Keep the lesson's flow: concrete problem
→ figure → worked trace → pitfalls → practice → check → recap.

## 5. Verify, record, commit

Follow [verify-change.md](../../../docs/playbooks/verify-change.md): the full
gate, `pnpm lab` still failing every case, `pnpm shots` for any figure touched,
and a `docs/VERIFICATION.md` entry. Commit this one lesson with a
`feat(content)` or `fix(content)` message that names what the learner now sees.

## 6. Report

Say what changed and why, what backs any new claim, the checks you ran, and
anything for the owner to review. Never change `status` or `reviewedAt`.
