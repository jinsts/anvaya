# Audit document template

Copy this into `docs/reviews/<subject>-audit-<YYYY-MM-DD>.md`. Link file:line
evidence relative to the review, for example
`[lesson](../../src/content/lessons/<subject>/<slug>.mdx#L120)`. Leave out
sections that do not apply, and say why in one line.

```markdown
---
title: <Subject> audit against the subject standard
status: draft
drafter: agent
auditDate: YYYY-MM-DD
auditedCommit: <short hash>
scope: subject | chapter <id> | lesson <id> | curriculum only
standard: docs/SUBJECT_STANDARD.md
---

# <Subject> audit

## Verdict

Two to four sentences: how close the scope is to the standard, the most
important gap, and whether the next step is fixes, a planning change or
drafting. Then: P0 n, P1 n, P2 n, P3 n.

## What is present

A table from `pnpm subject:report` (chapters, lessons, planned topics, minutes,
labs, figures computed from labs, verified outputs asserted, problems, sources),
with the command named. Do not hand-count.

## Scores

| Group | ID | Score | Evidence or exceptions |

All IDs, grouped C, L, V, E, P, W.

## Findings

Ordered by priority. Each one:

### P<n>. <Short title> (<IDs>)

What is wrong, with file:line evidence. Why it matters to the learner. The
smallest useful fix, and the skill or playbook that would make it
(enhance-lesson, draft-lesson, create-subject planning change, add-source …).

## Factual errors

Separate list, or "None found", saying how claims were checked.

## Report flags that are not findings

Each flag judged a false signal, with the reason.

## Standard feedback

Properties that seem wrong or too strict here, with evidence and a proposed
change to the standard, for the owner to decide.

## Recommended sequence

The order of fixes, grouped into changes of one lesson each where possible.

## Verification performed

Commands actually run with their results, pages opened, what was inspected
visually, and what was not checked.
```
