# Anvaya

Connect concepts. Build understanding.

A personal engineering learning platform: learn → visualize → experiment →
practise → recall → revisit. The library has a substantial Arrays lesson and a
smaller Hash Maps lesson, both drafts awaiting owner review, plus interview
practice: problems from reputable lists, a question drill and timed mock
interviews.

The approved architecture is in [ANVAYA_BOOTSTRAP.md](ANVAYA_BOOTSTRAP.md), with
later decisions in [docs/adr/](docs/adr/). Progress and measured results are in
[IMPLEMENTATION.md](IMPLEMENTATION.md) and [VERIFICATION.md](docs/VERIFICATION.md).
Agents start at [AGENTS.md](AGENTS.md).

## Run locally

Use the runtime in `.node-version` (Node 24.14.0, Node 24 LTS) and pnpm 9.15.9,
recorded in `packageManager`. Install that pnpm version using your preferred
package-manager installation method. Then, at the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Astro (normally `http://localhost:4321`).
Full-text search needs the index built by `pnpm build`, so use the production
output to search:

```sh
pnpm build
pnpm preview
```

Serve over HTTP; double-clicking files with `file://` is unsupported. No API keys,
accounts, backend, remote fonts or runtime services are required. Fonts and the
search index are local build assets. Astro development telemetry can be
disabled with `pnpm astro telemetry disable`. This repository does not configure
any deployment.

## Quality gate

```sh
pnpm exec playwright install chromium   # once
pnpm verify
```

`pnpm verify` runs, in order:

- `pnpm check`: Astro and TypeScript diagnostics.
- `pnpm format:check`: Prettier.
- `pnpm lint`: ESLint, design-token enforcement (`scripts/lint-styles.mjs`) and
  placeholder detection in content and labs (`scripts/lint-content.mjs`).
- `pnpm test`: unit, component and reference-lab tests.
- `pnpm build`: static build, Pagefind index, then link, anchor, heading,
  image-alternative and recap validation.
- `pnpm test:e2e`: desktop and mobile Chromium flows with axe scans in both
  themes.

On a fresh Linux CI machine, use `pnpm exec playwright install --with-deps chromium`
to install browser system libraries too. The E2E suite starts its own production
preview on `127.0.0.1:4321` (or reuses one already there). Build first.
Screenshots and traces go to the ignored `test-results/` and
`playwright-report/`. Real iOS/WebKit and manual screen-reader certification are
not implied.

## Practise

- **Lessons:** read [the Arrays lab](labs/dsa/arrays/README.md), implement its
  `starter.ts`, then run `pnpm lab dsa/arrays`. It fails until your
  implementation passes; `pnpm test:labs` checks the reference solutions.
- **Interview practice:** `/practice/` lists problems with filters, status and a
  timed mock interview. `/practice/questions/` drills each subject's interview
  questions, and each lesson ends with its own questions and problems.

## Add content

Follow the playbooks in [docs/playbooks/](docs/playbooks/):

```sh
pnpm new:lesson dsa/two-pointers --title "Two pointers: Walk from both ends" --path dsa-foundations --lab
pnpm new:problem two-sum --title "Two Sum" --url https://leetcode.com/problems/two-sum/ --difficulty easy --lesson dsa/hash-maps
```

Scaffolds contain `TODO` markers that `pnpm lint` rejects until replaced.

## Where things live

- `src/content/lessons/`: canonical MDX lessons, one folder per subject.
- `src/content/{categories,subjects,paths,skills}/`: discovery, study order and
  cross-cutting skills, one YAML file per entity.
- `src/content/sources/`: trusted sources; citations must match a registered prefix.
- `src/content/problems/`: interview problem references with original hints.
- `src/lib/`: schemas, catalog validation, array and practice logic.
- `src/components/`: shell, catalog, learning and interactive components.
- `src/scripts/`: progress, practice, drill, search and path-context enhancements.
- `labs/`: exercises, contracts, solutions and worked examples.
- `templates/`, `scripts/`: generators, linters and build validation.
- `tests/`: unit, component and browser tests.
- `docs/`: [authoring reference](docs/AUTHORING_GUIDE.md),
  [design system](docs/DESIGN_SYSTEM.md),
  [learning standards](docs/LEARNING_STANDARDS.md), [playbooks](docs/playbooks/)
  and [ADRs](docs/adr/).

## Boundaries and troubleshooting

The browser stores two keys locally: theme (`anvaya:theme:v1`) and progress
(`anvaya:progress:v1`, covering completed lessons, last lesson, problem status
and drill results). Home has Export, Import and Clear controls; browser
site-data controls also clear both keys. Corrupt data is ignored and blocked
storage falls back to memory for the session. Nothing syncs across devices.
Pages remain readable without JavaScript.

If install fails, verify Node/pnpm versions and registry connectivity; do not
replace the lockfile with another package manager's file. A TypeScript-major bump
must be compatible with Astro's checker and ESLint (currently TypeScript 6).
If preview exits, check port 4321 and permission to bind a loopback server.
If search says the index is missing, run `pnpm build` and use `pnpm preview`.
If Chromium cannot launch, install its OS dependencies and check sandbox policy.
Never report browser verification as passed if the browser did not run.

No push, hosting, public release, or open-source license is authorized by this
bootstrap. A remote host must protect every page and asset before private use.
