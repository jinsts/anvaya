# Review content before promotion

Only the owner promotes content. An agent may run this review and report its
findings, but never changes `status` or `reviewedAt`. Claude agents run it with
the `audit-subject` skill scoped to one lesson
(`.claude/skills/audit-subject/`).

## Review

Start from `pnpm subject:report <subject>/<lesson>`, then work through every
property in the [subject standard](../SUBJECT_STANDARD.md) for the lesson,
recording evidence for each. Then check its practice material:

- Interview answers agree with the lesson and its sources and state their
  assumptions. Follow-ups are reasonable next questions.
- Each linked problem applies an idea the lesson teaches. Its URL, title,
  difficulty and list memberships match the source. Hints are original and
  contain no code.
- Exercises were attempted independently before reading the reference
  solution (owner only).

Report each issue with its file and line and a suggested fix. Separate factual
errors from style suggestions.

## Promote (owner)

1. Fix or accept every finding, and work through the standard's
   "Promotion review" checklist, including attempting the lab first.
2. Set `status: reviewed` (or `published`) and `reviewedAt: YYYY-MM-DD` in the
   lesson frontmatter. Leave `drafter` unchanged as a record of authorship.
3. Run `pnpm verify` and commit with a message naming the reviewed lesson.

Learner progress (completion, problem status, drill results) lives in the
browser and never changes content status.
