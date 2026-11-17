---
title: Software Engineering & Architecture audit against the subject standard
status: draft
drafter: agent
auditDate: 2026-11-17
auditedCommit: 6d48b46
scope: curriculum only
standard: docs/SUBJECT_STANDARD.md
---

# Software Engineering & Architecture audit

## Verdict

This subject fits the standard least well as written. Its fourteen titles name
principles rather than mechanisms, several overlap each other, no registered
source supports it, and its interview section promises low-level design
practice that no topic provides. It can meet the standard: coupling metrics,
dependency graphs, API-compatibility rules and refactorings are all checkable
models. But the outline needs restructuring first. **P0 0, P1 3, P2 2, P3 1.**

## What is present

From `pnpm subject:report software-engineering-architecture`: one path
section, 14 planned topics, no lessons, labs or problems, and an overview with
all keys including a 7-chapter sketch. The report raised no flags.

## Scores

L, V, E, P and W are n/a: there are no lessons.

| Group | ID          | Score   | Evidence or exceptions                                                                                     |
| ----- | ----------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| C     | C1          | partial | Principles, APIs, testing and styles covered; low-level design practice and domain modelling missing (F3). |
| C     | C2          | partial | Overlap with distributed systems on boundaries and styles is unstated (F2).                                |
| C     | C3          | partial | No subject prerequisites; principles before patterns is sound, but no lesson-level order is evident (F1).  |
| C     | C4          | fail    | Titles are principles, not teaching units; several overlap (F1).                                           |
| C     | C5          | fail    | Internal overlaps: three principle titles, two paradigm titles (F1).                                       |
| C     | C6          | fail    | No running thread proposed (F6).                                                                           |
| C     | C7          | pass    | Overview claims map onto planned topics.                                                                   |
| C     | C8          | pass    | One section; the sketch agrees.                                                                            |
| —     | Feasibility | fail    | No registered source fits (F4); labs need deliberate design (F5).                                          |

## Findings

### F1 · P1. Titles are principles and overlap each other (C4, C5)

The titles at [lines 146–159](../../src/content/paths/engineering-fundamentals.yaml#L146)
overlap in two groups:

- "Software design principles", "Modularity, cohesion, and coupling" and
  "Abstractions and interfaces" overlap.
- "Programming paradigms" and "Object-oriented and functional design
  fundamentals" overlap.

"Architecture decision records" is a single practice, small for a page of its
own. **Fix:** restructure around mechanisms a learner can apply and be tested
on, for example:

1. information hiding and the cost of change;
2. coupling and cohesion as measurable properties (afferent and efferent
   coupling, instability);
3. dependency direction and stable abstractions;
4. polymorphism against composition;
5. immutability and pure functions.

Then patterns as trade-offs, contracts and compatibility, test boundaries and
doubles, refactoring under characterization tests, architectural styles, and
decisions with ADRs as one page with technical debt.

### F2 · P1. Boundaries with distributed systems are unstated (C2)

"Component and service boundaries" and "Architectural styles and patterns"
overlap distributed systems' "Scalability and architectural trade-offs" and its
service-boundary claims. **Fix:** this subject owns styles and boundaries as
design decisions (modular monolith, hexagonal, layered, event-driven as a
style). Distributed systems owns the runtime consequences (partial failure,
consistency, messaging guarantees). Each links to the other.

### F3 · P1. Low-level design practice is promised but not planned (C1)

The overview's interview section says object-oriented and low-level design
interviews "test modelling, interfaces and the use of patterns", but no planned
topic practises a design problem end to end. Domain modelling (entities,
aggregates, bounded contexts), which underpins service boundaries, is also
absent. **Fix:** add a chapter of two or three worked low-level design case
studies with contract-tested labs, and a domain-modelling page. Problems from
registered banks rarely fit (P7), so these labs carry the practice.

### F4 · P2. No registered source supports the subject (E8)

`system-design-primer` and `tech-interview-handbook` touch it only at the edges.
**Fix:** candidates to open and register:

- Parnas, "On the Criteria To Be Used in Decomposing Systems into Modules";
- _Software Engineering at Google_ (free online through abseil.io);
- Martin Fowler's site (refactoring catalog and architecture articles);
- Michael Nygard's original ADR article, and adr.github.io;
- Google's API design guide and AIPs (aip.dev);
- Semantic Versioning (semver.org).

None was opened for this audit. Book text must not be copied (E8).

### F5 · P2. Labs need deliberate design for a conceptual subject (P1, V2)

The standard requires an attempt lab with hidden contracts for every lesson.
Here the contract tests a model of the decision, not an algorithm. Examples:

- compute instability and find cycles in a module dependency graph;
- classify an API change as compatible or breaking;
- apply a refactoring while characterization tests stay green;
- choose the test double a boundary needs.

Figures can be computed from the same models, for example a dependency graph
coloured by instability. **Fix:** the proposal names a model and contract for
every page. If a page has no checkable model, it is probably not a teaching
unit.

### F6 · P3. No running thread (C6)

This repository is itself a candidate thread (its ADRs, module boundaries and
tests), as the overview's own ADR experiment suggests. A small, deliberately
coupled program refactored across the subject is an alternative. **Fix:**
propose one; the owner decides whether using Anvaya's code is wanted.

## Factual errors

None found; overview claims were read, not checked against external sources.

## Report flags that are not findings

None raised.

## Standard feedback

- **P1 for conceptual subjects:** the requirement is achievable, as F5 shows,
  but the standard could say explicitly that a lab may test a decision model
  (classification, metrics, compatibility), so agents do not invent artificial
  algorithms. ADR 0009 already notes this cost.

## Recommended sequence

1. Run create-subject with F1–F3 resolved in the proposal; F2 together with the
   distributed systems outline.
2. Register the sources the approved outline needs.
3. One planning change, then lesson-by-lesson drafting.

## Verification performed

On 2026-11-17 at `6d48b46`: `pnpm subject:report software-engineering-architecture`;
read the subject YAML and the neighbouring path sections. No external source
was opened.
