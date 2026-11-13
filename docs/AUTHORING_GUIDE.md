# Authoring reference

Field, component and convention reference for Anvaya content. For
step-by-step tasks use the [playbooks](playbooks/); for UI rules see
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## Content model

```text
Category ─< Category (parent)          discovery: Explore
Category ─< Subject ─< Path ─< Section (chapter) ─< Lesson (page)   study order
Path ─< Section ─> Subject                           a path may span subjects
Subject >─< Subject (prerequisites, related)
Subject >─< Skill >─< Lesson                         cross-cutting skills
Lesson  >─< Problem ─> Source (problem bank, problem lists)
Lesson  ─> Source (citations by URL prefix)
```

A path section is a chapter, and a lesson is one page holding one teaching unit
([ADR 0008](adr/0008-subject-chapters-and-lesson-pages.md)). In a path that spans
subjects, a subject's chapters are adjacent sections that name it; pages group
them under the subject.

| Entity   | File                                       | Schema                       |
| -------- | ------------------------------------------ | ---------------------------- |
| Lesson   | `src/content/lessons/<subject>/<slug>.mdx` | `src/lib/lesson-schema.ts`   |
| Category | `src/content/categories/<id>.yaml`         | `src/lib/content-schemas.ts` |
| Subject  | `src/content/subjects/<id>.yaml`           | `src/lib/content-schemas.ts` |
| Path     | `src/content/paths/<id>.yaml`              | `src/lib/content-schemas.ts` |
| Skill    | `src/content/skills/<id>.yaml`             | `src/lib/content-schemas.ts` |
| Source   | `src/content/sources/<id>.yaml`            | `src/lib/content-schemas.ts` |
| Problem  | `src/content/problems/<slug>.yaml`         | `src/lib/content-schemas.ts` |
| Lab      | `labs/<subject>/<slug>/`                   | Vitest contracts             |

IDs are lowercase kebab-case and come from file names. A lesson's ID is its
path under `lessons/` (`dsa/arrays`), and its folder must match its `subject`.
URLs are stable: `/learn/<id>/`, `/paths/<id>/`, `/subjects/<id>/`. When renaming
something that is linked externally, add a redirect in `astro.config.mjs`.

Zod schemas validate each file; `validateCatalog` in `src/lib/path-model.ts`
validates references across files on every build.

## Lesson frontmatter

| Field                | Required | Notes                                                                |
| -------------------- | -------- | -------------------------------------------------------------------- |
| `title`              | yes      | "Concept: hook", for example `Arrays: Think in indices`              |
| `shortTitle`         | no       | Navigation label, for example `Arrays`; defaults to `title`          |
| `summary`            | yes      | One concrete sentence about what the learner will understand         |
| `subject`            | yes      | Subject ID; must match the folder                                    |
| `path`               | no       | Default path ID; that path must list the lesson                      |
| `difficulty`         | yes      | `foundation`, `intermediate` or `advanced`                           |
| `estimatedMinutes`   | yes      | Reading plus practice time                                           |
| `learningObjectives` | yes      | 2–4 outcomes the learner can demonstrate                             |
| `prerequisites`      | no       | Lesson IDs; cycles are rejected                                      |
| `tags`               | no       | Kebab-case; reuse existing tags                                      |
| `skills`             | no       | Skill IDs from `src/content/skills/` that the lesson practises       |
| `status`             | yes      | `draft` until the owner promotes it                                  |
| `drafter`            | yes      | `agent` or `owner`; shown as provenance on the page                  |
| `reviewedAt`         | owner    | Required once `status` is `reviewed` or `published`                  |
| `interviewQuestions` | no       | `{ prompt, answer, followUps? }[]`; prompts unique within the lesson |
| `sources`            | yes      | `{ label, url }[]`; each URL starts with a registered source prefix  |

Interview question strings support only `` `code` `` and `**bold**`. They are
escaped and rendered in the lesson's Interview practice section and in the
question drill.

## Problems

| Field        | Notes                                                           |
| ------------ | --------------------------------------------------------------- |
| `title`      | The problem bank's title                                        |
| `url`        | Problem page; must match a registered `problem-bank` prefix     |
| `difficulty` | `easy`, `medium` or `hard`, as labelled by the source           |
| `lessons`    | Lesson IDs that teach the needed ideas (at least one)           |
| `topics`     | Kebab-case tags used by the practice search                     |
| `lists`      | Registered `problem-list` source IDs; only verified memberships |
| `hints`      | 1–4 original hints that escalate; no code or statements         |

## Sources

`name`, `kind`, optional `by`, `url`, optional `prefixes` (citations must start
with one of them; defaults to `url`) and `description`. See
[add-source.md](playbooks/add-source.md) for what qualifies.

## Components in lessons

These are available in every lesson without an import:

| Component         | Contract                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `Callout`         | `title`, optional `variant` `info` / `warning` / `success`; prose children                       |
| `CodeExample`     | `title`, `code` (import with `?raw`), optional `language` `ts`/`js`/`bash`, `output`, `verified` |
| `ComplexityTable` | `caption`, `rows: { operation, time, notes }[]`, optional `label`; children become a footnote    |
| `ConceptCheck`    | unique `id`, `question`, `options: { label, explanation, correct? }[]` with exactly one correct  |
| `DiagramFrame`    | `caption`; wraps an SVG or HTML figure                                                           |
| `LabCard`         | `title`, `command` (for example `pnpm lab dsa/arrays`); exercise text as children                |

Import lesson-specific components explicitly, such as `IndexedMemory` and the
`ArrayExplorer` island (`client:visible`). Import code with
`import source from '../../../../labs/<subject>/<slug>/file.ts?raw'`.

The layout renders the hero, prerequisites, objectives, the outline, the
Interview practice section, sources, completion controls and previous/next
links from metadata.

## MDX notes

- Leave blank lines around Markdown inside a component, and put block
  `<details>` / `<summary>` tags on their own lines.
- Use `{/* comments */}`, not HTML comments.
- Write `##` headings for sections; they form the outline. `## Two-minute
recap` is required.
- `pnpm check` does not compile MDX prose; `pnpm build` does.

## Commands

| Command                                                               | Purpose                                                    |
| --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `pnpm new:lesson <subject>/<slug> [--path id] [--lab]`                | Scaffold a lesson (and lab) from `templates/`              |
| `pnpm new:problem <slug> --title … --url … --difficulty … --lesson …` | Scaffold a problem reference                               |
| `pnpm lab <subject>/<slug>`                                           | Run the learner's attempt for one lab (fails until solved) |
| `pnpm lint`                                                           | ESLint, design-token and placeholder checks                |
| `pnpm verify`                                                         | Every quality gate, including the build and browser tests  |
