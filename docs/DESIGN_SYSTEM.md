# Design system

Anvaya should feel like a calm, focused learning app: cool neutral surfaces,
one blue accent, a tone per subject, generous reading typography and dense,
scannable lists where content grows. Decisions are recorded in
[ADR 0003](adr/0003-subject-catalog-and-reference-design.md) and
[ADR 0006](adr/0006-design-system-and-search.md).

## Tokens

`src/styles/global.css` defines every token for light and dark themes.
`pnpm lint` (`scripts/lint-styles.mjs`) rejects literal font sizes, the `font`
shorthand and literal colors outside that file.

| Group     | Tokens                                                                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type      | `--text-xs` 12 · `--text-sm` 14 · `--text-base` 16 · `--text-prose` 17 · `--text-lg` 18 · `--text-xl` 20 · `--text-2xl` 24 · `--text-3xl` 30 · `--text-4xl` 36 (px; the largest three shrink on phones) |
| Families  | `--font-body` Inter Variable · `--font-mono` JetBrains Mono Variable (self-hosted)                                                                                                                      |
| Leading   | `--leading-tight` 1.2 · `--leading-snug` 1.4 · `--leading` 1.6 · `--leading-prose` 1.75                                                                                                                 |
| Space     | `--space-1` … `--space-16` on a 4px grid                                                                                                                                                                |
| Radius    | `--radius-sm` 6 · `--radius` 10 · `--radius-lg` 14 · `--radius-full`                                                                                                                                    |
| Elevation | `--shadow-sm` (cards) · `--shadow` (hover) · `--shadow-lg` (popovers, drawer)                                                                                                                           |
| Surfaces  | `--bg`, `--surface`, `--subtle`, `--border`, `--border-strong`, `--text`, `--muted`                                                                                                                     |
| Semantic  | `--accent`, `--success`, `--warning`, `--error`, `--info`, each with a `-soft` background                                                                                                               |
| Tones     | `--tone-{blue,violet,teal,amber,rose,green}` and `-soft`; set `data-tone` to get `--tone`                                                                                                               |
| Layout    | `--article-measure` 70ch · `--header-height` · `--sidebar-width` · `--content-max`                                                                                                                      |

Use relative `em` sizes only for inline adjustments, such as code within text.
Text is at least 12px; body UI text is 14–16px; lesson prose is 17px.

## Page types

| Type      | Pages                            | Pattern                                                                                   |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| Dashboard | Home                             | Continue learning, practice summary, path progress, subjects, local data controls         |
| Catalog   | Explore, subject, paths, path    | `PageHeader` or toned hero, `SubjectCard` / `PathCard` grids, `LessonRow` syllabus lists  |
| Reading   | Lesson                           | Toned hero, 70ch prose with wider figures, sticky outline (collapsible on narrow screens) |
| Practice  | Practice, question drill, search | Filters, compact cards, one focused task at a time, status chips                          |

Use cards for featured items and lists for long collections. Never render an
unbounded collection as large cards.

## Components

- **Shell** (`BaseLayout`): header with Explore menu, search (press `/`), theme
  and menu controls; sidebar with main navigation and the current path's
  lessons with completion marks.
- **UI**: `Icon` (curated Lucide icons; add names to `src/lib/icons.ts`),
  `PageHeader`, `Breadcrumbs`.
- **Catalog**: `SubjectCard`, `PathCard` (progress bar and next lesson),
  `LessonRow` (number or check, title, summary, difficulty, minutes, draft).
- **Learning**: `Callout`, `CodeExample`, `ComplexityTable`, `ConceptCheck`,
  `DiagramFrame`, `LabCard`, `SectionTOC`, `InterviewPractice`.
- **Primitives** in `global.css`: `.card`, `.card-link`, `.stretched-link`,
  `.button` / `.button-primary` / `.button-ghost`, `.badge` (`data-variant`,
  `data-difficulty`), `.icon-tile`, `.progress` (`--value`), `.eyebrow`,
  `.lede`, `.section-head`, `.card-grid`, `.js-only`, `.sr-only`.

Extend an existing component before creating a new one, and keep styles scoped
to the component.

## Interaction and accessibility

- Target WCAG 2.2 AA. Every control has a visible focus ring and an accessible
  name; targets are at least 24px apart, and 44px on touch devices.
- Never use color alone: completion uses a check, statuses use labels and
  borders, quiz answers use text feedback.
- Announce dynamic results with `role="status"` and errors with `role="alert"`.
- Pages work without JavaScript: navigation, lessons and recaps render
  statically; progress, filters, the drill, the timer and search enhance
  them. Mark enhancement-only UI with `.js-only`.
- Respect reduced motion. Theme changes switch instantly (transitions are
  suspended during the switch).
- Progress is device-local (`anvaya:progress:v1`) and never implied by
  navigation alone.

## Before merging UI work

Check desktop and phone widths in light and dark themes, with keyboard-only
navigation and 200% zoom. For lesson figures and widgets, `pnpm shots
<subject>/<lesson>` captures 1280 and 390 px in both themes plus a page without
JavaScript ([verify-change.md](playbooks/verify-change.md)); look at every
image. `pnpm test:e2e` runs axe scans on the main page types
in both themes; it is a regression guard, not a full WCAG certification.
Add screenshot baselines only after the owner approves a design.
