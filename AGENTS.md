# Working on Anvaya

Anvaya is a static Astro/MDX learning platform with interview practice.
Content in Git is canonical; the owner reviews and promotes it. Read the guide
for your task below. Read `ANVAYA_BOOTSTRAP.md` fully only before architectural
changes; later decisions are recorded in `docs/adr/`. Every subject and lesson must
meet [docs/SUBJECT_STANDARD.md](docs/SUBJECT_STANDARD.md).

## Rules

- Write content as `status: draft` with `drafter: agent`. Never set
  `reviewed`, `published` or `reviewedAt`; only the owner promotes content.
- Draft lessons only for topics listed under `planned` in a path on the main
  branch, or that the owner requests. Propose new topics as a separate change.
  Add one lesson per change.
- Cite only sources registered in `src/content/sources/`. Never invent
  citations, list memberships or results. Never copy problem statements,
  editorials or book text; link to them and write original hints.
- Show only tested code (from `labs/`, imported with `?raw`); label anything
  illustrative. Use design tokens and existing components.
- Preserve static Astro/MDX, selective React islands, accessibility and
  reading without JavaScript. Add no backend, runtime service, analytics or
  remote assets.
- Do not push, deploy, import private material or choose a license without
  explicit owner authorization. Report only checks you actually ran.

## Task guides

| Task                                  | Read                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| Add or revise a lesson                | [docs/playbooks/add-lesson.md](docs/playbooks/add-lesson.md)                   |
| Add interview problems                | [docs/playbooks/add-problem.md](docs/playbooks/add-problem.md)                 |
| Add a category, subject or path       | [docs/playbooks/add-subject-or-path.md](docs/playbooks/add-subject-or-path.md) |
| Register a trusted source             | [docs/playbooks/add-source.md](docs/playbooks/add-source.md)                   |
| Build a diagram or interactive widget | [docs/playbooks/add-interactive.md](docs/playbooks/add-interactive.md)         |
| Review content before promotion       | [docs/playbooks/review-content.md](docs/playbooks/review-content.md)           |
| Look up fields and components         | [docs/AUTHORING_GUIDE.md](docs/AUTHORING_GUIDE.md)                             |
| Change UI, styles or tokens           | [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)                                 |
| Change architecture                   | `ANVAYA_BOOTSTRAP.md` (fully) and [docs/adr/](docs/adr/)                       |

## Verify

Run `pnpm verify` before handing work back: type check, formatting, lint
(including design-token and placeholder checks), unit tests, the static build
with search index and link validation, and browser tests. `pnpm lint` is the
fast first check. Record measured results in `docs/VERIFICATION.md` when you
finish a platform change.
