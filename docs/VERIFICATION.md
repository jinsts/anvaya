# Foundation verification — 2026-10-27

Local environment: Node 24.14.0, pnpm 9.15.9; Astro 7.4.2, MDX 8.1.1,
React integration 7.1.1, React 19.3.1, TypeScript 6.0.3. Exact dependency graph is
in `pnpm-lock.yaml`. Versions and runtime compatibility were checked against
official docs and actual registry metadata; no invented package versions.

## Executed checks

| Check                                                                                                 | Actual result                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile --offline` in a fresh temporary directory with just manifest/lockfile | Passed; installed 498 packages from the downloaded store, no lockfile changes                                        |
| `pnpm check`                                                                                          | Passed; Astro diagnostics: 0 errors, 0 warnings, 0 hints; tool/test TypeScript check passed                          |
| `pnpm lint`                                                                                           | Passed                                                                                                               |
| `pnpm format:check`                                                                                   | Passed                                                                                                               |
| `pnpm test`                                                                                           | Passed; 41 tests in five files, including reference exercise contracts                                               |
| `pnpm build`                                                                                          | Passed; six static pages; local links/assets, anchors, unique IDs, headings, image alternatives and recaps validated |
| `pnpm test:e2e`                                                                                       | Passed; 16 tests across desktop and mobile Chromium                                                                  |
| `pnpm dev --host 127.0.0.1 --port 4322`                                                               | Served home, DSA path, Arrays and Hash Maps with HTTP 200; stopped after verification                                |

The learner attempt command, `pnpm lab:arrays`, is deliberately excluded from the
quality gate and is **not reported as passing**. Its starter functions are TODOs
for the learner. The same behavioral contracts are exercised against reference
solutions by `pnpm test`.

## Browser evidence

Playwright ran against production static preview at 1440 × 1000 and 390 × 664 CSS
pixels (mobile Chromium emulation), with extra 720px reflow checks. Verified:

- Home → path → Arrays → Hash Maps → previous lesson, plus TOC anchors.
- Exact insert-30-at-2 example, capacity doubling, individual shifts, final labels,
  deterministic reset and cell inspection using keyboard.
- Empty input/read error, insert into empty, insert at end, invalid index,
  update, append and removal.
- Native diagram buttons and SVG hotspots, keyboard activation and live feedback.
- Light/dark/system preference, persistence, live system change, blocked-storage
  fallback, reduced-motion preference and mobile Menu/Escape behavior.
- Concept search/no-results and quiz wrong/right/retry explanations.
- Reading the core lesson and recap with JavaScript disabled.
- Eight axe WCAG-tag scans (home/Arrays × light/dark × desktop/mobile), zero
  reported violations. Navigation flow reported no page errors or failed local requests.

Screenshots were inspected for desktop/mobile layout, dark/light readability,
legibility and the insertion result. This review found and corrected low contrast
in the selected preview label and syntax highlighting; code now uses Shiki high
contrast themes. Controls were moved above cells to improve mobile stepping.

Reproducible captures are generated under `test-results/`, including:

- `foundation-themes-persist--c1ef0-tion-narrow-layout-and-a11y-desktop/home-light.png`
- `foundation-themes-persist--c1ef0-tion-narrow-layout-and-a11y-desktop/home-dark.png`
- `foundation-themes-persist--c1ef0-tion-narrow-layout-and-a11y-mobile/home-light.png`
- `foundation-themes-persist--c1ef0-tion-narrow-layout-and-a11y-mobile/lesson-dark.png`
- `foundation-manual-insert-t-6f195-cessible-keyboard-selection-mobile/explorer-insert.png`

Generated screenshots/reports are ignored by Git; rerun the browser suite to
recreate them. No automatic visual-baseline acceptance was used.

## Limits and scope

Initial sandbox restrictions blocked npm DNS and preview startup; both were
resolved through approved tool permissions. No verification remains blocked.
The clean install reused package-store downloads; it was not a fresh OS image.
The GitHub Actions workflow is authored and hash-pinned but has not run remotely.
Real Safari/iOS devices, manual screen-reader evaluation and full WCAG conformance
are not claimed. The 720px check approximates layout reflow under desktop zoom;
it is not an actual browser zoom certification.

Only Arrays and Hash Maps exist. Their claims were checked against linked primary
sources and code examples executed, but owner pedagogical review remains required;
both retain draft status. No learner progress store, backend, runtime services,
offline cache, push, deployment, remote configuration change or license selection.

After owner review and independent practice, the next recommended single topic
is **two pointers**, extending the Arrays model with a focused invariant.

## Design and discovery refinement — 2026-10-28

The owner-approved visual and navigation changes are implemented locally. The
library still contains only the original Arrays and Hash Maps drafts. The
reference sites informed visual patterns; no private content or source was
imported. No dependency or service was added.

| Check                                   | Result for this increment                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                            | Passed; 0 errors, warnings or hints, including tools/tests                                                                  |
| `pnpm lint`                             | Passed                                                                                                                      |
| `pnpm format:check`                     | Passed                                                                                                                      |
| `pnpm test`                             | Passed; 50 tests across six files                                                                                           |
| `pnpm build`                            | Passed; eight static pages; local links, assets, anchors and lesson recaps validated                                        |
| `pnpm exec playwright install chromium` | Passed; existing browser installation reused                                                                                |
| `pnpm test:e2e`                         | Final full run passed; 28 desktop/mobile Chromium tests                                                                     |
| Accessibility                           | 16 axe WCAG-tag scans across home, Arrays, Explore and subject pages, light/dark and desktop/mobile; no reported violations |
| `git diff --check`                      | Passed                                                                                                                      |

The browser suite now exercises Home → Explore → category → subcategory →
subject → path → Arrays, category Back and browser history, direct query restore,
global search, contextual lesson navigation, unknown path fallback, keyboard
Explore disclosure and mobile drawer focus/inert behavior. Existing simulator,
quiz, storage fallback, reduced-motion and JavaScript-disabled reading checks
continue to pass. Shared-path switching, focus, adjacency and standalone behavior
are also covered with synthetic DOM fixtures in the unit suite, without adding a
second curriculum to the product. The catalog model tests cover a non-CS subject.

Screenshot inspection covered light/dark desktop/mobile discovery and subject
pages, the home, Arrays hero, outline and simulator. This found and corrected two
issues: sidebar numbers lost contrast through opacity, and an inherited reduced-
motion duration rule unintentionally activated transitions during theme changes.
Reduced motion now disables transitions/animations directly; its browser
regression checks that no running animations remain.

Catalog captures are generated by the browser suite under:

- `test-results/catalog-catalog-and-subjec-94d3b-nd-pass-accessibility-scans-desktop/`
- `test-results/catalog-catalog-and-subjec-94d3b-nd-pass-accessibility-scans-mobile/`

Each contains `explore-light.png`, `explore-dark.png`, `subject-light.png` and
`subject-dark.png`. Additional top-of-page review captures from this session are
under `test-results/design-review/`: `arrays-{desktop,mobile}-{light,dark}.png`
and `home-{desktop,mobile}-dark.png`. All generated evidence remains ignored.

The prior verification limits still apply: mobile Chromium is emulation, remote
GitHub Actions has not run, and owner pedagogical review is pending. No deployment,
push, content promotion or learner-progress implementation occurred.

## Platform v2 — 2026-10-29

Scope: [IMPLEMENTATION.md](../IMPLEMENTATION.md) (platform v2) and ADRs 0004–0006.
Added dependencies: `@fontsource-variable/inter` 5.3.0,
`@fontsource-variable/jetbrains-mono` 5.3.0 and `@lucide/astro` 1.63.0 (build
time, declares Astro 7 support), plus `pagefind` 1.5.2 (dev). Versions were
checked against registry metadata. Fonts are OFL-1.1, Pagefind is MIT.

| Check                   | Result                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify`           | Exit 0: every gate below in one run                                                                                                                                                   |
| `pnpm check`            | 0 errors, warnings or hints (`playwright-report/` and `test-results/` are now excluded from type checking)                                                                            |
| `pnpm format:check`     | Passed                                                                                                                                                                                |
| `pnpm lint`             | ESLint, design-token and placeholder checks passed; both new linters were shown to fail on probe violations                                                                           |
| `pnpm test`             | 63 tests in 8 files: catalog validation, progress store, practice logic, formatting, explorer, path context, labs                                                                     |
| `pnpm test:labs`        | 19 reference tests passed; `pnpm lab dsa/arrays` runs only that lab and fails on the learner TODOs, as designed                                                                       |
| `pnpm build`            | 11 static pages; Pagefind indexed 5 pages; links, anchors, headings, image alternatives and recaps validated                                                                          |
| `pnpm test:e2e`         | 36 passed: 18 scenarios on desktop and mobile Chromium, including 36 axe scans across 9 page types and 2 themes                                                                       |
| Theme-switch stress run | 32 of 32 passed (both theme tests × 2 projects × 8 repeats)                                                                                                                           |
| Generators              | Scaffolded lesson, lab and problem; lint flagged every TODO; build named the missing path entry; guards refused duplicates, unknown subjects and missing lessons; probe files removed |

Browser review covered Home, Explore, subject, paths, path, both lessons,
search, practice and question drill at 1440 × 900 and 390 × 844 in both themes.
It found and fixed:

- Missing spaces in count labels such as "2lessons".
- Uneven practice filters on phones.
- Color transitions during theme switches, which made scans flaky and caused
  visible flicker. Transitions are now suspended deterministically.
- A WCAG 2.2 target-size failure on adjacent source links.
- Absolute URLs written by the progress script.

The browser suite reused the preview server already listening on
`127.0.0.1:4321` (Playwright reuses servers outside CI). That server serves the
rebuilt `dist/`, confirmed by the new Pagefind assets returning HTTP 200.

### Scale benchmark

A scratch copy (repository untouched) was filled with 3,000 synthetic lessons
across 50 subjects and paths, each lesson with eight sections and an interview
question.

| Measure (3,000 lessons) | Before (review)       | After                                                                            |
| ----------------------- | --------------------- | -------------------------------------------------------------------------------- |
| Astro build             | 48.4 s, 4.0 GB peak   | 36.6 s, 3.9 GB peak (memoized catalog)                                           |
| Search page             | 3.3 MB, every card    | 19.5 KB; Pagefind indexed 3,105 pages in 1.65 s (14 MB index, fetched in chunks) |
| Build validation        | Exhausted a 4 GB heap | 16.7 s, 0.8 GB (keeps only IDs and links)                                        |
| Question drill          | 2.3 MB on one page    | One page per subject                                                             |

At that size the paths index is 725 KB raw (45 KB gzip), because each path card
lists its lessons for progress. That is acceptable now; revisit it if a library
has dozens of long paths.

### Content verification

- Problem slugs, titles, difficulty and Blind 75 / NeetCode 150 membership were
  checked against NeetCode's published `.problemSiteData.json`. Blind 75 was
  cross-checked against the Tech Interview Handbook. Grind 75 membership is not
  claimed: the default 75 come from a scheduler over 169 problems.
- Every registered source URL returned HTTP 200 except LeetCode, which returns
  403 to automated clients.
- Interview answers and hints are original agent drafts. They agree with the
  lessons and sources but await owner review, like both lessons.

### Limits

Mobile results come from Chromium emulation. The GitHub Actions workflow has
not run remotely. No screenshot baselines were added; they wait for owner
approval of the design. Labs remain TypeScript-only, and choosing another
interview language is an owner decision. No push, deployment or remote change
was made.

## Curriculum scaffolding — 2026-11-12

Scope: [ADR 0007](adr/0007-curriculum-scaffolding.md). No dependency was added;
seven Lucide icons already in `@lucide/astro` were registered.

| Check               | Result                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`        | 0 errors, warnings or hints (80 files, plus tools/tests)                                                                  |
| `pnpm format:check` | Passed                                                                                                                    |
| `pnpm lint`         | ESLint, design-token and placeholder checks passed                                                                        |
| `pnpm test`         | 66 tests in 8 files (3 new: subject links and cycles, cross-subject sections and ordering, skill references)              |
| `pnpm build`        | 19 static pages (was 11); links, anchors, headings, image alternatives and recaps validated; Pagefind indexed 13 pages    |
| `git diff --check`  | Passed                                                                                                                    |
| `pnpm test:e2e`     | **Not run to completion.** All 36 tests failed at browser launch: `libnspr4.so` is missing, so Chromium cannot start here |

The built HTML was inspected with Cheerio: Explore lists 8 subjects, the paths
page lists 2 paths, the new path shows 7 sections and 88 planned topics, each new
subject page renders all twelve overview parts, and the DSA subject page is
unchanged.

Not verified: browser behaviour, visual layout in both themes and at phone
width, and axe scans of the new pages. `tests/e2e/catalog.spec.ts` was edited
(the subject count is now 8, and the DSA card is selected by link) and gained
scans for one new subject page and the new path. Those edits have not run. Run
`pnpm exec playwright install --with-deps chromium && pnpm verify` where the
browser can start before relying on them.

## Computer Architecture & Execution drafts — 2026-11-12

All nine approved topics in the first Engineering Fundamentals section now have
lessons, each added with its lab and path entry in a separate local commit. All
nine retain `status: draft` and `drafter: agent`, with no `reviewedAt`. The subject
name and stable IDs are unchanged. The material includes nine tested educational
models, 27 exercises with attempt-first hints, nine concept checks, and 41
interview questions with model answers.

Local environment: Node 24.21.0 and pnpm 9.15.9. Chromium initially lacked
`libnspr4`, `libnss3`, and ALSA libraries. Ubuntu packages were downloaded and
extracted under `/tmp/anvaya-browser-deps`; no system packages or repository
dependencies were installed. The successful full verification command was:

```sh
PLAYWRIGHT_PORT=4323 \
  LD_LIBRARY_PATH=/tmp/anvaya-browser-deps/usr/lib/x86_64-linux-gnu \
  pnpm verify
```

| Check               | Measured result                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `pnpm verify`       | Exit 0; all gates completed in the same run                                                                    |
| `pnpm check`        | 98 files; zero errors, warnings, or hints; tools and lab TypeScript passed                                     |
| `pnpm format:check` | Passed                                                                                                         |
| `pnpm lint`         | ESLint, design-token checks, and placeholder checks passed                                                     |
| `pnpm test`         | 151 tests in 17 files passed; 85 new model tests include exact displayed outputs and representation boundaries |
| `pnpm build`        | 29 static pages validated; Pagefind indexed 22 pages; local links, anchors, headings, and recaps passed        |
| `pnpm test:e2e`     | 36 desktop/mobile Chromium tests passed                                                                        |

The instruction encoder also round-trips all 8,192 valid field combinations
inside its tests. Other model tests cover branching and step limits, invalid
relocations, overflow and padding, cold/conflict cache misses, independent frame
and allocation lifetimes, protected entry and return, I/O ownership transitions,
and fixed-work CPU-time/Amdahl calculations. These tests establish the models'
contracts; they are not native hardware measurements.

Four consulted primary references were registered: Dive into Systems, MIT
Computation Structures, Operating Systems: Three Easy Pieces, and Linux kernel
documentation. Specific chapter and documentation URLs appear in each lesson.
Existing MDN references support JavaScript-specific claims.

The three new problem references are Number of 1 Bits, Reverse Bits, and Add
Binary. Their pages were opened to check titles and difficulty. Blind 75 and
NeetCode 150 membership for the first two was checked against the published
[`blind75` and `neetcode150` flags](https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json).
Add Binary claims no list membership. All hints are original. Hardware lessons
use original lab investigations and interview questions rather than unrelated
coding-bank problems.

Browser verification found and corrected a path-page selector that expanded
hidden accessible labels to 200px, and two lesson tables that exceeded a 390px
viewport. The tables now use the existing scroll-region pattern, with accessible
names and keyboard focus. Review also corrected an unintended numbered list in
the execution walkthrough. Long unbroken expected-output values now wrap inside
`CodeExample`, avoiding an unfocusable horizontal scroll area on phones.

An additional browser audit covered every new lesson at 1440 × 1000 and
390 × 844 in light and dark themes:

- All 36 lesson viewport/theme combinations fit the document width. Keyboard
  quiz submissions exercised both wrong and correct explanations.
- 76 successful axe scans covered the top and settled quiz state of every
  lesson, plus the subject's question drill in both themes and widths. Final
  scans reported no violations. Reduced motion kept focus scrolling settled
  during these measurements.
- All 18 JavaScript-disabled readings retained prose, tested code, and recaps.
  Each of the 21 exercise-hint disclosures opened and closed by keyboard at
  both widths: 84 toggles.
- Both narrow table regions responded to ArrowRight with JavaScript enabled
  and disabled. The representation output fit its 348px content area after
  wrapping.
- Subject/path links and the nine-lesson order worked. The 41-question drill
  revealed answers and retained review choices; the representation practice
  filter showed the three new problems.

Representative hero and code screenshots were inspected in both widths and
themes. Additional evidence remains local under `/tmp/anvaya-content-review/`,
including `final-report.json`; it is not a committed visual baseline.

The first browser attempt reused an existing development server, which did not
serve the production search index; a subsequent preview launch hit Astro's
server lock. The test configuration now accepts `PLAYWRIGHT_PORT` and starts
the static preview with `--ignore-lock`, allowing the successful isolated run
without stopping the existing development server.

Owner pedagogical review and promotion remain pending. The runnable labs are
TypeScript models, and native compilation experiments, hardware counters, and
performance benchmarks were not run. Mobile checks use Chromium emulation;
real-device and manual screen-reader testing are not claimed. No content was
promoted, pushed, or deployed.

## Architecture audit revisions — 2026-11-13

Executed the [curriculum audit](reviews/computer-architecture-execution-audit.md)
within the existing nine lessons. All remain `draft` with `drafter: agent`.
Representation now precedes instruction decoding, with matching prerequisites.
Nine primary mechanism figures cover execution, instruction fields, build
artifacts, representation, caches, lifetimes, privilege, I/O ownership, and
Amdahl time fractions. The performance lesson also works an explicit dependency
and branch timeline. Figures use local HTML/CSS, tokens, labelled states and
native text alternatives; they require no JavaScript or remote assets.

Complete model listings are in native disclosures. Redundant trace tables,
pipeline/ABI exposition and repeated exercises were removed; simulator
bookkeeping is optional reference material. New work includes tested binary32
inspection, rounding boundaries, Unicode counting, address/width explanations,
coherence/visibility diagnosis, and real compiler artifacts.

The shared native lab compiled and executed original C at `-O0` and `-O2`
with `-fno-inline`, generated the displayed assembly, inspected undefined object
symbols using GNU `nm`, and verified both returned and stored values. The recorded
target is Linux x86-64/System V with GCC 15.2.0. Compiler packages were extracted
into `/tmp/anvaya-cc`; no repository dependency was added. The local wrapper
`/tmp/anvaya-cc/compiler` supplies that extracted toolchain's paths. On a matching
system, `ANVAYA_CC=cc` selects the installed compiler instead.

The locality experiment sums a 2048×2048 uint32 matrix in both traversal orders,
alternates which goes first, records six observations per order and checks all
checksums. Its actual observations, timestamp, compiler, flags and CPU are in
`labs/computer-architecture-execution/architecture-and-performance/measurement.json`.
No timing threshold is asserted. Hardware counters, CPU affinity and frequency
were not controlled; the lesson separates observations from causal hypotheses.

Three selected labs now have separate learner starters and shared contracts.
Their unsolved attempt commands were run and each exited 1 with the intentional
implementation error. The same contracts passed against reference implementations.
These starter failures are expected and excluded from the ordinary quality gate.

Successful verification used:

```sh
ANVAYA_CC=/tmp/anvaya-cc/compiler \
  PLAYWRIGHT_PORT=4331 \
  LD_LIBRARY_PATH=/tmp/anvaya-browser-deps/usr/lib/x86_64-linux-gnu \
  pnpm verify
```

| Check               | Result                                                          |
| ------------------- | --------------------------------------------------------------- |
| Type checking       | Zero errors, warnings or hints                                  |
| Formatting and lint | Passed, including token and placeholder checks                  |
| Unit/lab tests      | 164 passed in 22 files, including native compilation/execution  |
| Static build        | 29 pages; 22 search pages; link, anchor and recap checks passed |
| Browser tests       | 56 passed across desktop and mobile Chromium                    |

The twenty new browser cases cover all nine revised lessons in both themes,
document overflow, mechanism figures, keyboard source disclosures and quiz
feedback, plus reading and disclosures without JavaScript. Each lesson/theme
receives an axe WCAG-tag scan. Native checks are explicitly skipped when
`ANVAYA_CC` is absent; the successful run above enabled and executed them.

Figure-level screenshots were inspected for instruction fields and Amdahl bars
at desktop/mobile widths in light and dark themes. Labels remained readable and
the diagrams fit their containers. Captures remain local under
`/tmp/anvaya-revision-visuals/`; no visual baselines were accepted.

Owner promotion and independent pedagogical review remain pending. Browser
coverage uses Chromium emulation, not physical devices or manual screen-reader
evaluation. No push, deployment, new runtime service, or content promotion occurred.

## Subject chapters — 2026-11-13

Platform change for [ADR 0008](adr/0008-subject-chapters-and-lesson-pages.md),
run with the same local toolchain as the previous entry:

```sh
ANVAYA_CC=/tmp/anvaya-cc/compiler \
  PLAYWRIGHT_PORT=4339 \
  LD_LIBRARY_PATH=/tmp/anvaya-browser-deps/usr/lib/x86_64-linux-gnu \
  pnpm verify
```

| Check               | Result                                                          |
| ------------------- | --------------------------------------------------------------- |
| Type checking       | 118 files; zero errors, warnings or hints                       |
| Formatting and lint | Passed, including token and placeholder checks                  |
| Unit/lab tests      | 165 passed in 22 files, including native compilation/execution  |
| Static build        | 29 pages; 22 search pages; link, anchor and recap checks passed |
| Browser tests       | 58 passed across desktop and mobile Chromium                    |

The new unit test covers grouping, separated chapters and the duplicate
overview outline. The new browser test checks one subject heading with six
chapter headings on the path page, chapter links from the subject outline to
their path anchors, and the subject label in the study sidebar. The existing
axe scans cover the changed path and subject pages in both themes.

Screenshots of the path page (desktop light, mobile dark), the subject outline
(desktop dark), the lesson sidebar and the unchanged DSA path were inspected.
Review found that HTML compression removed the space between "Chapter N" and
the chapter title in accessible names; an explicit space fixed it. Captures
remain local in the session scratchpad; no visual baselines were accepted.
No push, deployment or content promotion occurred.
