# 0007 — Curriculum scaffolding: cross-subject paths, subject overviews and skills

Date: 2026-11-12. Status: accepted; implemented locally.

## Context

The owner requested a long-term curriculum, Engineering Fundamentals: seven
subjects, each with an initial topic outline, plus ten cross-cutting skills such
as debugging and profiling. The catalog (ADR 0003, 0004) could not hold it:

- A path belonged to exactly one subject, so a curriculum spanning subjects had
  no home.
- A subject appeared only once it had a lesson, and nothing described what a
  subject covered, what to study first or how it related to others.
- Cross-cutting skills had no representation, so they would have been either
  duplicated in every subject or dropped.

The curriculum is a plan. No lesson exists yet, and none may be implied.

## Decision

- **Cross-subject paths.** A path may omit `subject` if every section names its
  own. Paths gain optional `shortTitle`, `audience` and `objectives`. A section
  is the curriculum's module: it groups the lessons and `planned` topics of one
  subject. Planned topics remain the single place where a subject's topic
  outline is stored; subject pages derive their outline from them.
- **Subject overviews.** Subjects gain `priority`, `prerequisites` and `related`
  (each link carries a reason), and an optional `overview` holding the twelve
  standard parts (introduction through future chapters). The page renders
  nothing for a subject that has no overview, so existing subjects are unchanged.
- **Skills as a collection.** `src/content/skills/<id>.yaml` defines a
  cross-cutting skill once. A subject states how it exercises each skill, and a
  lesson may list `skills`. Path pages derive the cross-cutting view, so no text
  is repeated across subjects.
- **Visibility.** A subject is listed when it has an overview, a lesson or a path
  section. Every path is listed, including a path with only planned topics.
- **Validation.** The build rejects cycles in subject prerequisites, a path that
  teaches a subject before its prerequisite, unknown subjects or skills, and a
  section without a subject.
- **Authorization.** The owner requested the path, its subjects and their topic
  outlines, so those `planned` topics are owner-approved for drafting under
  `AGENTS.md`. Agents still draft one lesson per change and never promote status.

## What is deliberately not modelled

- **Competency validation.** Overviews list expected competencies. Recording
  that a competency was achieved is a claim only the owner can make, and ADR 0005
  keeps progress to lessons and problems. Add it only after a real need.
- **Difficulty** stays a lesson field. **Practical exercises** stay labs and
  lesson `LabCard`s, and overviews list recommended experiments.
- **Learn → Visualize → Experiment → Practise → Recall → Revisit** is an
  authoring convention in the add-lesson playbook, not a schema.

## Consequences

Adding a subject's detailed curriculum is a sequence of single-lesson changes
that move a topic from `planned` to `lessons`; no restructuring is required.
Skills and overviews live in YAML, so they are searchable and validated but
carry no lesson-level prose. The cost is a larger subject schema. Overviews are
agent drafts until the owner reviews them, like lessons.
