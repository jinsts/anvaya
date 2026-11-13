# Add a category, subject or path

Discovery (categories → subjects) is separate from study order (paths →
sections → lessons). Each entity is one YAML file whose name is its ID
(lowercase kebab-case). Add entities only when there is something to study.

## Category: `src/content/categories/<id>.yaml`

```yaml
title: Languages
description: Learn how human languages work and how to use them.
parent: humanities # optional; another category ID
```

Root categories (without a `parent`) appear in Explore once a subject in them
has a lesson.

## Subject: `src/content/subjects/<id>.yaml`

```yaml
title: System Design
description: Reason about scale, reliability and trade-offs in distributed systems.
category: computer-science
icon: layers # a name from src/lib/icons.ts
tone: violet # blue | violet | teal | amber | rose | green
```

Lessons live in `src/content/lessons/<subject>/`. A subject appears once it has
a lesson, an overview, or a path section. Choose a tone that differs from
neighboring subjects.

A subject that is planned before it has lessons may add `priority` (`low`,
`medium`, `high`, `very-high`), links to other subjects, how it exercises
cross-cutting skills, and an `overview`:

```yaml
priority: very-high
prerequisites: # subjects to study first; cycles are rejected
  - subject: computer-networking
    why: Message loss and latency are the raw material of distributed failures.
related:
  - subject: software-engineering-architecture
    why: Service boundaries decide where distribution appears.
skills: # IDs from src/content/skills/
  - skill: debugging
    focus: Reconstruct failures from timelines, logs and traces.
overview: # introduction, whyItMatters, objectives, mechanisms, applications,
  # experiments, architecture, competencies, interview, chapters
```

Write overview text that is specific to the subject. The topic outline is not
repeated in the overview: it is the `planned` list of the path sections that
teach the subject. Competencies are expectations; never record that one was
achieved. See `computer-architecture-execution.yaml` for a complete example.

## Path: `src/content/paths/<id>.yaml`

```yaml
title: System Design Interviews
description: Build the vocabulary and trade-off reasoning that design interviews test.
subject: system-design
order: 2 # lower sorts first; the first path is the home page's "Start here"
sections:
  - id: foundations
    title: Foundations
    lessons:
      - system-design/latency-and-throughput
    planned:
      - Caching
      - Load balancing
```

- A path that spans subjects omits `subject`, and each section names its own
  (`subject: distributed-systems`). Order sections so a subject follows its
  prerequisites. Optional `shortTitle`, `audience` and `objectives` describe it.
  See `engineering-fundamentals.yaml`.
- A short path may use a flat `lessons` list (with an optional `planned` list)
  instead of `sections`.
- A lesson can appear in several paths. Its `path` frontmatter names its
  default; other paths link to it with `?path=` context.
- `planned` lists owner-approved topic titles that have no lesson yet. They
  show as "Planned" rows and are the curriculum agents may draft. Agents may
  propose planned topics in a separate change; the owner approves by merging.

### Chapters

Each section is a chapter ([ADR 0008](../adr/0008-subject-chapters-and-lesson-pages.md)).
A single-subject path's sections are its chapters. In a path that spans
subjects, a subject starts as one section; to divide it, replace that section
with adjacent sections that each name the subject:

```yaml
sections:
  - id: architecture-memory-hierarchy # unique within the path
    title: The memory hierarchy # shown as the chapter title
    subject: computer-architecture-execution
    lessons:
      - computer-architecture-execution/memory-hierarchy-and-caches
    planned:
      - Cache organization and write policies
```

- Keep a subject's chapters together; the build rejects separated chapters.
- Remove the subject's `overview.chapters` sketch in the same change; the build
  rejects both at once.
- Existing lessons keep their IDs. Split a broad planned topic into one planned
  page per teaching unit, and note in a YAML comment which existing lesson
  hands over that material when the page is drafted.
- Restructuring is a planning change of its own. Draft the new pages afterwards,
  one lesson per change.

## Skill: `src/content/skills/<id>.yaml`

```yaml
title: Debugging & root-cause analysis
description: Form hypotheses from symptoms and trace a failure to its mechanism.
```

A cross-cutting skill is defined once. Subjects say how they exercise it
(`skills` above) and lessons may list its ID in `skills`. Do not create a skill
that is really a subject, and do not repeat a skill's text in subjects.

## Start a subject's detailed curriculum

1. Pick a topic from a section's `planned` list, or one the owner requests.
2. Follow [add-lesson.md](add-lesson.md): scaffold with
   `pnpm new:lesson <subject>/<slug> --path <path-id>`.
3. Move the topic from the section's `planned` list to its `lessons` list.
4. Add the lesson's `skills` and `prerequisites`, then run `pnpm verify`.

One lesson per change. Overview text may need a small edit once a lesson
teaches part of it; keep it accurate.

## Verify

Run `pnpm build`. The catalog validator rejects unknown references, category
or prerequisite cycles, duplicate entries and empty sections. Then check the
Explore, subject and path pages.
