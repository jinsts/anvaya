# Scoring rubric

Score each ID in [docs/SUBJECT_STANDARD.md](../../../docs/SUBJECT_STANDARD.md)
for the audited scope.

| Score   | Meaning                                                                                |
| ------- | -------------------------------------------------------------------------------------- |
| pass    | Every lesson (or the subject) meets the property; cite one piece of evidence.          |
| partial | Most meet it; list each exception with file:line.                                      |
| fail    | It is missing or wrong in most of the scope, or wrong anywhere in a way that misleads. |
| n/a     | It does not apply to this scope (for example L–P for a subject with no lessons).       |

A property scored partial or fail becomes one or more findings.

## Priorities

| Priority | Use for                                                                                                                                                    | Examples                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **P0**   | Factual errors and evidence integrity: a wrong claim, a fabricated or unasserted result, an uncited or unread source, an answer that contradicts its test. | An E2 output no test asserts; a measured claim the recording does not support; a wrong formula. |
| **P1**   | A learner is blocked or misled: an answer given away before the attempt, a missing lab, a prerequisite used before it is taught, a broken lab command.     | L6 reveals; P1 missing lab; C3 order violation; L10 command that tests nothing.                 |
| **P2**   | Standard conformance that weakens teaching: oversized pages, duplicated teaching, hand-typed figure values, thin contracts, missing predict moments.       | C4 at 55 minutes; C5 duplicate; V2 hand-typed; P2 two cases; L5 none.                           |
| **P3**   | Polish and consistency.                                                                                                                                    | L10 numbering style; P6 README title; L13 a slightly stale link that still resolves.            |

Raise a priority when a gap repeats across a chapter, and lower it when the
lesson explicitly handles the case another way. Say so in the finding.

## Curriculum-only audits

For a subject with an outline and no lessons, score:

- **C1 coverage:** list the competencies and interview deep dives a working
  engineer at the target level needs, and mark which planned topic covers each,
  which none covers, and which planned topics are low value.
- **C2 boundary:** topics that overlap other subjects, and who should own them.
- **C3 order:** prerequisites between planned topics, and subject prerequisites
  in the path.
- **C4 units:** planned titles that hold several teaching units, with a
  suggested split and an estimate of pages.
- **C5 duplication:** planned titles repeated across subjects, and concepts
  already taught in a drafted subject.
- **C7 overview:** claims the overview makes that no planned topic supports.
- **Feasibility:** registered sources that fit, sources that would have to be
  registered, toolchains and tools needed for labs and evidence, and what would
  have to be owner-run.

## Standard feedback

When a property fails for a reason that seems right (for example a concept
figure with nothing to compute, or a length limit that an excellent lesson
exceeds for a reason), record it under "Standard feedback" with the evidence
and a proposed change. The owner decides; the audit does not change the
standard.
