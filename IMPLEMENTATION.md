# Foundation implementation

Baseline: [ANVAYA_BOOTSTRAP.md](ANVAYA_BOOTSTRAP.md). Scope is Milestones 0–3;
only Arrays and the smaller Hash Maps sample. No remote changes or deployment.

- [x] **0 — Discover:** read baseline fully; inspect empty Git repository and tools;
      verify Astro prerequisites and package registry; record architecture decisions.
- [x] **1 — Foundation:** strict Astro/MDX, selective React, typed content/path data,
      responsive shell, theme, home/path/concept/lesson routes; check and build.
- [x] **2 — Teaching implementation:** Arrays, accessible diagram, step explorer, two tested labs,
      Hash Maps sample; browser interaction and visual verification.
- [x] **3 — Quality:** validators, unit/component/E2E tests, CI, authoring/design
      documentation, measured final verification.

Environment: Node 24.14.0 (LTS series), pnpm 9.15.9. Registry confirms Astro 7.4.2
requires Node >=22.23.4. Registry networking needs the approved pnpm escalation.
Exact dependencies are recorded in `pnpm-lock.yaml`. Lesson status stays draft
until owner review; automated checks do not certify conceptual mastery.

Milestone 1 checkpoint: `pnpm check` passed (0 errors/warnings, 2 deprecation hints),
`pnpm build` passed and validated all six pages and internal links/anchors.
TypeScript 6.0.3 selected because current Astro checker and typescript-eslint do
not support TypeScript 7 yet. Astro development telemetry disabled locally.

Milestones 2–3 implementation and local checks are complete. Final checks have
zero type errors, warnings or hints; 41 unit/component/reference-lab tests and
16 desktop/mobile browser tests pass. Eight light/dark home/Arrays accessibility
scans report no violations. See [verification evidence](docs/VERIFICATION.md).

Owner review of lesson concepts and independent exercise attempts remain open;
neither lesson is marked reviewed. Milestone 4 (progress, sync, full-text search,
offline support and private deployment) remains deferred. Next single lesson to
consider after studying these drafts: two pointers.

## Design and discovery refinement — 2026-10-28

Owner-approved follow-on: [ADR 0003](docs/adr/0003-subject-catalog-and-reference-design.md).

- [x] Replace the warm green/serif design with cool neutrals, blue accents,
      compact sans-serif type and coordinated light/dark teaching surfaces.
- [x] Implement Explore and subject overview using shared category/subject data.
- [x] Separate global discovery from contextual path sections and lesson outline.
- [x] Support standalone and shared lessons, preserving canonical URLs and an
      optional validated path context. Keep both existing lessons as drafts.
- [x] Finish integrated quality checks, browser review and verification evidence:
      50 unit/component tests, 28 desktop/mobile browser tests, 16 clean axe scans,
      type checks, lint, formatting, static build and internal-link validation.
      See [verification evidence](docs/VERIFICATION.md).

No additional curriculum, learner progress storage, services or remote changes
are part of this increment. Optional Milestone 4 remains deferred.

## Platform v2: scale, design, interview practice and authoring — 2026-10-28

Follows the owner-requested repository review. Decisions:
[ADR 0004](docs/adr/0004-content-collections-and-agent-authoring.md),
[ADR 0005](docs/adr/0005-interview-practice-and-local-progress.md) and
[ADR 0006](docs/adr/0006-design-system-and-search.md).

- [x] Commit the ADR 0003 increment as a baseline on branch `platform-v2`.
- [x] Fix the review's defects: lesson prose ran to ~115 characters per line;
      the sources note always said "draft"; `pnpm lab:arrays` would run every
      lab; the catalog was re-validated for every page; Home hard-coded the
      Arrays lesson and DSA path; navigation labels split titles on `:`; the
      complexity table was Arrays-only.
- [x] Move categories, subjects and paths to YAML collections. Add a trusted
      source registry, problem references, planned topics and cross-file
      validation.
- [x] Design system v2: self-hosted fonts, token scales with lint enforcement,
      Lucide icons, subject tones, dashboard, catalog, reading and practice
      page types.
- [x] Interview practice: lesson interview questions, 12 verified problem
      references, tracker with filters and statuses, mock interview timer,
      per-subject question drill, and local progress with export, import and clear.
- [x] Pagefind full-text search with section links.
- [x] Agent authoring: router `AGENTS.md`, six playbooks, authoring reference,
      templates, generators and `pnpm verify`.
- [x] Fix what a 3,000-lesson benchmark exposed: build validation now uses
      constant memory per page, and the drill has one page per subject.
- [x] Measured verification in [VERIFICATION.md](docs/VERIFICATION.md).

Both lessons remain drafts (`drafter: agent`). No new lesson was written; the
DSA path lists four planned topics taken from the bootstrap hierarchy (§3.1)
and the earlier recommendation of two pointers. No push, deployment, runtime
service, license or remote change.

## Curriculum scaffolding: Engineering Fundamentals — 2026-11-12

Owner request, decided in [ADR 0007](docs/adr/0007-curriculum-scaffolding.md).

- [x] Cross-subject paths, subject overviews and a skills collection in the
      content model, with cross-file validation.
- [x] One path (`engineering-fundamentals`), seven subjects with overviews and
      ten cross-cutting skills. The owner's topic outlines are the `planned`
      lists (88 topics); there are no lessons.
- [x] Subject and path pages render the overview, outline, skills and
      prerequisite links. Playbook, authoring guide and README updated.
- [ ] Browser tests and visual review of the new pages: not run in the
      authoring environment (Chromium could not start). See
      [VERIFICATION.md](docs/VERIFICATION.md).
- [ ] Owner review of the subject overviews, which are agent drafts.

No lesson was written, no competency is recorded as achieved, and no push,
deployment or license choice is part of this entry.

## Subject chapters and lesson pages — 2026-11-13

Owner request, proposed in [ADR 0008](docs/adr/0008-subject-chapters-and-lesson-pages.md).

- [x] A path section is a chapter. A subject's adjacent sections are grouped on
      the path page, the study sidebar and the subject outline; separated
      chapters and a duplicate overview chapter list fail the build.
- [x] Lesson sizing guidance: one teaching unit per page, usually 15–30 minutes.
- [x] Computer Architecture & Execution restructured into six chapters. Its nine
      lessons keep their URLs; ten planned pages hold split or missing material.
- [ ] Owner review of the ADR and the restructured outline (approve by merging).
- [ ] Draft the planned pages, one lesson per change, moving material out of the
      existing lessons named in the path's YAML comments.
