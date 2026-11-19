# 0009 — Subject standard and authoring skills

Date: 2026-11-17. Status: proposed; implemented locally for owner review.

## Context

Computer Architecture & Execution (PR #9) is the level every subject should
start at. How it reached that level was recorded only in commits,
`docs/VERIFICATION.md` and the correction note in its audit. The guidance
agents follow still described the earlier lesson:

- `add-lesson.md` named `dsa/arrays` as the reference, made labs optional, asked
  for 3–6 linked problems and gated with `lint`, `test` and `build` only.
- `add-interactive.md` placed models in `src/lib/`, while the architecture
  figures import the tested lab models.
- `templates/lab/` produced a `solution.ts` lab with visible test cases.
- The screenshot review at 390 and 1280 px used an uncommitted script, and the
  per-lesson browser checks ran from a hard-coded list of architecture slugs.
- `docs/LEARNING_STANDARDS.md` and bootstrap §3.4 held two different lesson
  anatomies.

The owner will add subjects through agents and then improve lessons gradually
while studying, so the bar has to be written down, checkable and repeatable.

## Decision

- **One standard.** `docs/SUBJECT_STANDARD.md` is the canonical quality bar
  for curriculum, lesson anatomy, visuals, evidence, practice and process, with
  numbered properties and how each is checked. The promotion checklist moves
  into it, and `LEARNING_STANDARDS.md` is removed. Where it differs from
  bootstrap §3.4, §8 or §10.3, the standard wins.
- **Skills.** Four project skills in `.claude/skills/` drive the playbooks and
  scripts: `create-subject`, `draft-lesson`, `enhance-lesson` and
  `audit-subject`. They are plain Markdown, and `AGENTS.md` points to them so
  any agent can follow the same steps.
- **Every lesson has an attempt lab** with hidden contracts, a failing starter
  and a cross-check against the reference model. The lab template follows that
  pattern, and `pnpm new:lesson` always creates it.
- **Problems only where genuine**, replacing the quota of 3–6 per lesson.
- **Checks follow the standard automatically.** `tests/e2e/lessons.spec.ts`
  runs the per-lesson browser checks on every lesson except listed legacy ones.
  `pnpm subject:report` reports a subject's inventory against the standard's
  IDs, and `pnpm shots` captures figures for review.
- **Subject planning is a proposal first.** `create-subject` interviews the
  owner, writes an outline in `docs/proposals/`, and waits for approval. An
  approved outline becomes one planning change to the path and subject YAML,
  then one lesson per change with checkpoints between them.

## What is deliberately not enforced

Pedagogical properties such as a useful analogy, a single teaching home or an
honest overview cannot be checked by a script. The report flags signals and an
audit records evidence, but neither fails the build. Thresholds such as minutes
and counts stay advisory, so a justified exception does not need a code change.

## Consequences

A new subject is planned, drafted and audited against one written bar, and its
lessons get browser checks without editing a test list. Audits become
comparable because their inventories come from the same script. The cost is a
longer standard to read and stricter labs for conceptual topics, where a
contract may test a decision model rather than an algorithm. The two DSA
lessons are recorded as known exceptions until they are revised.
