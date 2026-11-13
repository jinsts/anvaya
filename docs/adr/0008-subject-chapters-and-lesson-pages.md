# 0008 — Subject chapters and lesson pages

Date: 2026-11-13. Status: proposed; implemented locally for owner review.

## Context

The owner studies a subject as chapters, each with as many pages as its
material needs. A subject such as DSA may need 15–20 chapters. The catalog did
not express that clearly:

- In a path that spans subjects, each subject was one section, so Computer
  Architecture & Execution appeared as nine flat lessons.
- Each planned topic became exactly one 35–60 minute page. Broad topics such as
  "Memory hierarchy, caches, RAM, and storage" were compressed into a single
  lesson, which the curriculum review identified as a cause of thin coverage.
- The subject overview held a free-text `chapters` list that matched neither
  the lessons nor any navigation, so a subject had two outlines.

Bootstrap §6.2 already allows a path to group lessons by section, and §18 asks
for small platform changes rather than rebuilds.

## Options

1. **Sections are chapters.** A subject may have several adjacent sections in a
   path. Pages group them under the subject. No schema nesting.
2. **One path per subject**, with Engineering Fundamentals reduced to a roadmap.
   Lesson order would be maintained in two places, and the cross-subject path
   would lose its lesson sequence.
3. **A new chapter level** (path → section → chapter → lesson). This adds a
   schema level, validation and navigation depth that option 1 provides without
   them.
4. **Multi-page lessons.** One lesson with child pages would break the rule that
   a lesson is one URL with one set of objectives, progress and practice.

## Decision

Adopt option 1.

- **A chapter is a path section.** A single-subject path's sections are its
  chapters. In a path that spans subjects, a subject's chapters are adjacent
  sections that name it. The build rejects a path that separates them.
- **Presentation.** The path page shows one heading per subject, with numbered
  chapter headings beneath it when the subject has several. The study sidebar
  labels the subject once above its chapters. The subject page's topic outline
  lists the chapters. Chapters use `#section-<id>` anchors; a subject heading
  with several chapters uses `#subject-<id>`.
- **A lesson is one page and one teaching unit:** one mechanism, its worked
  example and its practice. Aim for 15–30 minutes and consider splitting above
  about 45. A planned topic becomes as many lessons as it has teaching units.
- **One outline.** The overview `chapters` list becomes an optional sketch for a
  subject still taught by one section. The build rejects it once sections divide
  the subject into chapters.
- **Stable URLs.** When a lesson is split, it keeps its ID for the material it
  retains and new pages get new IDs. Changing an existing ID requires a redirect
  in `astro.config.mjs`.
- **Restructuring is planning.** Dividing a subject into chapters and adding
  planned pages split from approved topics is a separate change that the owner
  approves by merging. Each new page is then drafted as its own change.

## What is deliberately not modelled

- Nested chapters, chapter landing pages and per-chapter metadata such as
  objectives or estimated time. Chapter totals are derived from their lessons.
- The position of a planned topic among drafted lessons. Planned rows display
  after a chapter's lessons; YAML comments may record an intended position.

## Consequences

Computer Architecture & Execution becomes six chapters: its nine lessons keep
their URLs and ten planned pages hold the material split from them or still
missing. DSA can grow to 15–20 chapters as sections of its own path without
platform work. The other six Engineering Fundamentals subjects are unchanged
until their curricula are structured. Section titles now read as chapter
titles, and path pages count chapters rather than sections.
