# Working on Anvaya

Anvaya is a static Astro/MDX learning platform with interview practice.
Content in Git is canonical; the owner reviews and promotes it. Every subject
and lesson must meet [docs/SUBJECT_STANDARD.md](docs/SUBJECT_STANDARD.md); the
Computer Architecture & Execution lessons are the reference. Read the guide for
your task below. Read `ANVAYA_BOOTSTRAP.md` fully only before architectural
changes; later decisions are recorded in `docs/adr/` and override it.

## Rules

- Write content as `status: draft` with `drafter: agent`. Never set
  `reviewed`, `published` or `reviewedAt`; only the owner promotes content.
- Draft lessons only for topics listed under `planned` in a path on the main
  branch, or that the owner requests. Propose new subjects, chapters and topics
  as a separate planning change and wait for approval. Add one lesson per
  change and per commit.
- Every lesson has an attempt lab with hidden contracts (`pnpm lab`). Build the
  lab and its tested model first, then the figures from it, then the prose.
- Cite only sources registered in `src/content/sources/`, at pages you opened.
  Never invent citations, list memberships or results. Never copy problem
  statements, editorials or book text; link to them and write original hints.
  Link problems only where they genuinely apply.
- Show only tested code (from `labs/`, imported with `?raw`); label anything
  illustrative. Figures compute their values from tested models or recorded
  artifacts. Use design tokens and existing components.
- Preserve static Astro/MDX, selective React islands, accessibility and
  reading without JavaScript. Add no backend, runtime service, analytics or
  remote assets.
- Do not push, deploy, import private material or choose a license without
  explicit owner authorization. Report only checks you actually ran, and list
  claims that need the owner's review separately.

## Task guides

| Task                                        | Read                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| Quality bar for any content                 | [docs/SUBJECT_STANDARD.md](docs/SUBJECT_STANDARD.md)                           |
| Add or revise a lesson                      | [docs/playbooks/add-lesson.md](docs/playbooks/add-lesson.md)                   |
| Verify, record and commit any change        | [docs/playbooks/verify-change.md](docs/playbooks/verify-change.md)             |
| Add interview problems                      | [docs/playbooks/add-problem.md](docs/playbooks/add-problem.md)                 |
| Add a category, subject, path or curriculum | [docs/playbooks/add-subject-or-path.md](docs/playbooks/add-subject-or-path.md) |
| Register a trusted source                   | [docs/playbooks/add-source.md](docs/playbooks/add-source.md)                   |
| Build a diagram or interactive widget       | [docs/playbooks/add-interactive.md](docs/playbooks/add-interactive.md)         |
| Review content before promotion             | [docs/playbooks/review-content.md](docs/playbooks/review-content.md)           |
| Look up fields, components and lab layout   | [docs/AUTHORING_GUIDE.md](docs/AUTHORING_GUIDE.md)                             |
| Change UI, styles or tokens                 | [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)                                 |
| Change architecture                         | `ANVAYA_BOOTSTRAP.md` (fully) and [docs/adr/](docs/adr/)                       |

## Skills

Project skills in `.claude/skills/` run the playbooks and scripts in a fixed
order with the owner's checkpoints. Any agent can follow them: read the
`SKILL.md` and the files it links.

| Skill                                                    | Use it to                                                                                                                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [create-subject](.claude/skills/create-subject/SKILL.md) | Interview the owner, propose a full outline, and after approval plan and draft a subject lesson by lesson                                |
| [draft-lesson](.claude/skills/draft-lesson/SKILL.md)     | Draft one planned or requested lesson with its lab, figures and record, and commit it alone                                              |
| [enhance-lesson](.claude/skills/enhance-lesson/SKILL.md) | Add a point, figure, worked example, lab case, problem or source to a lesson while studying, or bring a legacy lesson up to the standard |
| [audit-subject](.claude/skills/audit-subject/SKILL.md)   | Score a subject, chapter or lesson against the standard and write a prioritized fix list                                                 |

## Verify

Run `pnpm verify` with the toolchain environment before every commit (setup and
command in [verify-change.md](docs/playbooks/verify-change.md)): type check,
formatting, lint (including design-token and placeholder checks), unit and lab
tests with native drift checks, the static build with search index and link
validation, and browser tests for every lesson. `pnpm lint` is the fast first
check. For lessons, also review `pnpm shots` captures and check
`pnpm subject:report`. Record measured results in `docs/VERIFICATION.md` for
every change.
