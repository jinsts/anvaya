---
name: audit-subject
description: Score an Anvaya subject, chapter or single lesson against docs/SUBJECT_STANDARD.md and write a prioritized fix list to docs/reviews/. Works on outline-only subjects (curriculum audit) and on drafted ones (full audit), and serves as the agent's pre-promotion review of a lesson. Use when the owner asks to audit, review, score or assess a subject or lesson.
---

# Audit a subject

Find what stands between a subject and the standard, with evidence, and say
what to fix first. The model is
[docs/reviews/computer-architecture-execution-audit.md](../../../docs/reviews/computer-architecture-execution-audit.md).
An audit proposes; it changes no lesson and never promotes content.

## 1. Scope

- **Subject** (`<subject>`), **chapter** (one path section) or **lesson**
  (`<subject>/<slug>`, the pre-promotion review).
- If the subject has no lessons, audit the curriculum only: C1–C8, plus how
  feasible the evidence and labs will be (sources, toolchains). Mark L, V, E
  and P as not applicable rather than failed.

## 2. Inventory (never hand-count)

Record `git rev-parse --short HEAD`. Run
`pnpm subject:report <scope> --json > <scratch>/report.json` and the Markdown
form. Its counts are your inventory; its flags are leads, not findings.

## 3. Read everything in scope

The subject YAML and overview, its path sections and neighbouring subjects'
outlines, every lesson, lab (model, tests, contracts, README), imported
component, linked problem and cited source, and the subject's
`docs/VERIFICATION.md` entries. For a drafted subject, also run the lab tests,
`pnpm lab` on a sample of labs, and `pnpm shots` on any lesson whose figures you
judge. Open cited pages where a claim depends on them.

## 4. Score

Score every standard ID with [rubric.md](rubric.md): pass, partial, fail or n/a,
with file:line evidence. For each report flag, decide:

- **Real gap:** a finding.
- **False signal:** say why, for example that a concept figure has nothing to
  compute.
- **Standard issue:** the standard is wrong or too strict here. Record it under
  "Standard feedback"; do not bend the score.

Keep factual errors separate from style and conformance.

## 5. Write the audit

Write `docs/reviews/<subject>-audit-<YYYY-MM-DD>.md` (add `-<chapter>` or
`-<slug>` for a narrower scope) from [audit-template.md](audit-template.md). Each
finding gets a priority, the smallest useful fix and the skill that would make
it. List only checks you actually ran. Then verify, record and commit
([verify-change.md](../../../docs/playbooks/verify-change.md)):
`docs(reviews): audit <scope> against the subject standard`.

## 6. Report

Give the overall verdict, the counts per priority, the top three fixes, any
factual errors, and any standard feedback that needs the owner's decision. Do
not start fixing unless the owner asks.
