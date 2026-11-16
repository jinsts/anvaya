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

## Cache organization lesson — 2026-11-13

Draft of the planned page "Cache organization and write policies", with a tested
lab model, a static placement figure and an interactive explorer that runs the
same lab model. Same local toolchain as the previous entry:

| Check               | Result                                                          |
| ------------------- | --------------------------------------------------------------- |
| Type checking       | Zero errors, warnings or hints                                  |
| Formatting and lint | Passed, including token and placeholder checks                  |
| Unit/lab tests      | 189 passed in 26 files, including native compilation/execution  |
| Static build        | 30 pages; 23 search pages; link, anchor and recap checks passed |
| Browser tests       | 62 passed across desktop and mobile Chromium                    |

The lab tests check placement in three organizations, LRU against a stream that
FIFO would handle differently, miss classification against a fully associative
shadow cache, both write policies with and without write-allocate, invalid
input, the lesson's matrix-padding and 16-array claims on the recorded L1d
geometry, and the exact displayed output. A further test derives every set count
in the recorded `lscpu --caches` output from size, ways and line size. The
learner attempt fails until implemented, as intended. Component tests cover
prediction scoring, organization and policy changes, reset and the LRU marker;
a browser test drives the explorer by keyboard. The axe scans, overflow checks
and JavaScript-disabled checks now include the new lesson.

Screenshots of the figure and explorer at 1280 px (light) and 390 px (dark) were
inspected. Review fixed inline-code borders inside the bit fields, truncated
select labels, a cramped fully associative panel, an overflowing set label, and
prose list spacing that offset the first field. No console errors or page
overflow occurred. No visual baselines were accepted.

One full run failed because the mock-interview test lists the problems it may
draw at random, and the new LRU Cache problem was missing from that list. After
adding it, the test passed 20 repeated runs on desktop and mobile, and the full
gate passed again.

## Floating-point representation lesson — 2026-11-15

Draft of the planned page "Floating-point representation and rounding". The
`/tmp` toolchains were rebuilt from Ubuntu 26.04 packages (GCC 15.2.0 under
`/tmp/anvaya-cc`, Chromium libraries under `/tmp/anvaya-browser-deps`) and the
unchanged branch passed the full gate first (189 tests, 30 pages, 62 browser
tests).

```sh
ANVAYA_CC=/tmp/anvaya-cc/compiler PLAYWRIGHT_PORT=4351 \
  LD_LIBRARY_PATH=/tmp/anvaya-browser-deps/usr/lib/x86_64-linux-gnu pnpm verify
```

| Check               | Result                                                          |
| ------------------- | --------------------------------------------------------------- |
| Type checking       | Zero errors, warnings or hints                                  |
| Formatting and lint | Passed, including token and placeholder checks                  |
| Unit/lab tests      | 213 passed in 29 files, including native compilation/execution  |
| Static build        | 31 pages; 24 search pages; link, anchor and recap checks passed |
| Browser tests       | 66 passed across desktop and mobile Chromium                    |

The binary32 model's exact decimal values, `0.1`, the smallest subnormal, the
largest finite value and the binary64 values of `0.1` and `0.1 + 0.2`, were
cross-checked with Python's `struct` and `decimal` modules. Four static figures
(field anatomy, spacing, ties to even, summation order) are computed from the
model at build time; the explorer island runs the same model. Component tests
cover bit flips, typed input and its error, presets at the exponent edges,
roving keyboard focus and the prediction challenges; a browser test drives the
bits and a challenge by keyboard. The learner attempt fails until implemented.

Screenshots of every figure and the explorer at 1280 px and 390 px in both
themes were inspected. Review fixed colliding axis labels, a table that
overflowed at 390 px, a wrapped summation column, a space lost to HTML
compression, and a two-column readout that split long numbers on phones. No
console errors or page overflow occurred. Sources consulted: Dive into Systems
4.8, Goldberg's paper (newly registered), ECMA-262 and the GCC 15.2 manual
(newly registered).

## Native lab drift check — 2026-11-15

`verify-native.mjs` now lists its checked programs, deterministic artifacts and
measurements. On every run it regenerates each artifact and fails if it differs
from the committed copy, provided the compiler reports the recorded version in
`toolchain.json`; otherwise the comparison is reported as skipped. Measurements
now record the target and `lscpu --caches` output beside the compiler and CPU.
`setup-gcc-ubuntu.sh` documents and reproduces the extracted GCC 15.2 toolchain;
it was run into an empty scratch folder and compiled and ran a test program.

With the rebuilt compiler, the three committed artifacts (`bump-O0.txt`,
`bump-O2.txt`, `object-symbols.txt`) regenerated byte for byte. The native test
passed with `ANVAYA_CC` and was reported as skipped without it. The full gate
(same command as the previous entry) passed: zero type errors, warnings or
hints; formatting and lint; 213 tests in 29 files; 31 pages; 66 browser tests.

## Text encodings and memory layout lesson — 2026-11-15

Draft of the planned page "Text encodings and memory layout". A new native
program, `representation.c`, prints this target's integer and floating-point
bytes, a UTF-8 literal and two record layouts; the native lab compiles it and
checks its output against the committed copy. Lab tests compare the UTF-8
encoder with `TextEncoder` at every length boundary, the UTF-16 model with
JavaScript strings, and the byte-order, UTF-8 and layout models with that
recorded native output. The attempt contracts were cross-checked with Python's
UTF-8 encoder. UTF-8 Validation's title and difficulty came from LeetCode's
public GraphQL endpoint; NeetCode's published data lists it on neither Blind 75
nor NeetCode 150, so it claims no list. Encode and Decode Strings was not linked
because it is paid-only on LeetCode.

Same command as the previous entry:

| Check               | Result                                                          |
| ------------------- | --------------------------------------------------------------- |
| Type checking       | Zero errors, warnings or hints                                  |
| Formatting and lint | Passed, including token and placeholder checks                  |
| Unit/lab tests      | 231 passed in 32 files, including native compilation/execution  |
| Static build        | 32 pages; 25 search pages; link, anchor and recap checks passed |
| Browser tests       | 70 passed across desktop and mobile Chromium                    |

Screenshots of the UTF-8, text ladder and byte-order figures and the layout
explorer at 1280 px and 390 px in both themes were inspected. Review fixed list
indentation leaking from prose styles, a lost border color, and field names that
broke mid-word at 390 px: the byte grid now draws each field and padding run as
one block. In this environment's Chromium the emoji glyph renders as a missing
glyph box; its code point is labelled in the next row. Component tests cover
moves, reset, sorting and focus retention; a browser test reorders by keyboard.

## Binary representation narrowed to integers — 2026-11-15

Follow-up to the two split pages: the lesson now teaches integers and bits
only. Floating point, text, byte order and layout moved out with their tests
(`inspect.ts` was removed; the floating-point and text labs replace it). The
ArchitectureFlow text card is replaced by a four-bit two's complement wheel,
whose carry and overflow breaks are found by the model, a grid of the four
carry/overflow combinations, and a byte explorer island with sign/zero
extension and a predict-then-add panel. The model gained sign and zero
extension and logical and arithmetic shifts; its tests check every byte, all
65,536 byte pairs against the hardware sign rule for overflow, and every shift.
Sum of Two Integers, Reverse Integer and Counting Bits were added; their titles
and difficulty came from LeetCode's GraphQL endpoint and their Blind 75 and
NeetCode 150 flags from NeetCode's published data. The stack lesson's layout
link and prerequisite now point to the text and layout page.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 229 tests in 32 files; 32 pages; 72 browser tests,
including a new keyboard test of the byte explorer. Screenshots of the wheel,
grid and explorer at 1280 px and 390 px in both themes were inspected; review
widened the wheel's view box so side labels cannot clip, replaced a `pre` that
picked up indentation, and shortened a wrapping label in the explorer.

## Execution lesson datapath — 2026-11-15

The program-execution lesson's text-card figure is replaced by a datapath
stepper: an SVG block diagram (PC, next-PC adder, instruction memory, decoder,
registers, ALU, data memory) whose highlighted units and wires come from a new
tested register-machine model (`datapath.ts`). The learner predicts which state
a load, an add and a store change before each step; active wires draw in once,
and reduced motion shows them immediately. A table gives the same trace without
JavaScript. A second figure plots the accumulator machine's executed positions
over time from its tested trace, showing static and dynamic counts and the
taken branch. The simulator's cost paragraph moved into a disclosure.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 235 tests in 34 files; 32 pages; 74 browser tests,
including a keyboard test of the stepper. Screenshots at 1280 px and 390 px in
both themes, before and after a step, were inspected. Review fixed wire labels
that CSS had re-anchored onto their wires, added halos where labels cross dashed
lines, and moved three labels clipped by boxes or lines.

## Reading assembly lesson — 2026-11-15

Draft of the planned page "Reading assembly: branches, loops, and calls". The
native lab gained `sum.c` (a loop), `scale.c` (a non-leaf call to a function in
another file) and `main.c` (assertions); all three are compiled together and run
at `-O0` and `-O2`. Their `-O0` and `-O2` listings for x86-64, and `-O2`
listings from GCC 15.2 targeting aarch64-linux-gnu, are drift-checked artifacts.
The ARM64 compiler was extracted from Ubuntu's `gcc-15-aarch64-linux-gnu`
packages into `/tmp/anvaya-cc-arm64` and is selected with `ANVAYA_CC_ARM64`;
without it the ARM64 comparison is reported as skipped.

A new tested model interprets the subset of x86-64 these listings use, parsing
the committed files directly. Its tests check the results of all four x86-64
listings and both `bump` listings against the native program's assertions,
callee-saved `rbx`, a balanced stack and 16-byte alignment at the call,
executed-instruction counts (58 at `-O0`, 23 at `-O2`, also counted by hand),
basic blocks, the trace table, and signed and unsigned jump conditions at their
overflow edges; the attempt contracts were also cross-checked with an
independent Python flag computation. Annotations that link C to assembly are
checked against the listings. Two sources were registered after reading the
relevant sections: the x86-64 psABI (register usage, stack alignment) and Arm's
AAPCS64 (link register, callee-saved registers).

```sh
ANVAYA_CC=/tmp/anvaya-cc/compiler ANVAYA_CC_ARM64=/tmp/anvaya-cc-arm64/compiler \
  PLAYWRIGHT_PORT=4351 \
  LD_LIBRARY_PATH=/tmp/anvaya-browser-deps/usr/lib/x86_64-linux-gnu pnpm verify
```

| Check               | Result                                                          |
| ------------------- | --------------------------------------------------------------- |
| Type checking       | Zero errors, warnings or hints                                  |
| Formatting and lint | Passed, including token and placeholder checks                  |
| Unit/lab tests      | 257 passed in 37 files, including native and ARM64 drift checks |
| Static build        | 33 pages; 26 search pages; link, anchor and recap checks passed |
| Browser tests       | 78 passed across desktop and mobile Chromium                    |

The first full run failed: the generic lesson test looks for a disclosure whose
summary starts "Inspect the tested model", and this page's summary did not. It
passed after renaming. Screenshots of both annotated listings, the control-flow
figure and the stepper at 1280 px and 390 px in both themes were inspected;
review wrapped a clipped C line, removed vertical jump labels that collided
with their lanes, and put two wide tables in scroll regions after a 27 px
overflow at 390 px.

## Registers lesson state panel and attempt — 2026-11-15

The registers lesson gains a register-and-memory panel for GCC's real `bump`:
the committed `-O2` listing runs in the reading-assembly interpreter, which now
records watched memory bytes after each step, so the figure shows `eax` and the
four little-endian bytes at entry and after each data instruction. A new lab
test runs the lesson's transfer task (41 at address 2000) the same way. The
first exercise became an attempt lab with hidden decoding contracts, the
decoder's cost paragraph moved into a disclosure, the calling-convention
section now defers to the assembly and stack lessons, and the duplicated
sign-extension example links to the binary lesson instead.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 264 tests in 39 files; 33 pages; 78 browser tests.
The unsolved attempt fails as intended. Screenshots of the panel at 1280 px and
390 px in both themes were inspected; no layout fixes were needed.

## Compilation lesson artifacts and relocation — 2026-11-15

The compilation lesson's text card is replaced by two figures built from new
recorded artifacts: `objdump -dr` of `scale.o` (a call with four placeholder
bytes and an `R_X86_64_PLT32 sum_to-0x4` relocation) and `objdump -d` plus `nm`
of the linked executable (`call 1260 <sum_to>`). The native lab regenerates and
drift-checks both, and `toolchain.json` now records the binutils version, since
the system's binutils 2.46 assembles, links and disassembles. A new tested
model parses both files and computes S + A − P; its test checks that the result
is the byte sequence the linker wrote and that the call lands on `sum_to`. The
attempt lab asks for the same computation, with contracts cross-checked in
Python. The teaching linker moved into a disclosure, the duplicated diagnosis
paragraph was removed, and the third exercise was replaced by the attempt. The
prerequisite is now the reading-assembly lesson.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 272 tests in 41 files; 33 pages; 78 browser tests.
Screenshots of both figures at 1280 px and 390 px in both themes were
inspected; review relabelled the object file's bytes with offsets instead of
executable addresses.

## Stack lesson frames and lifetimes — 2026-11-15

The stack lesson's text card is replaced by two visuals. A static figure shows
GCC's `-O0` `scale_sum` and `sum_to` frames while `sum_to` runs: slot names come
from the prologue's stores and values from the reading-assembly interpreter's
memory, so it shows the real return addresses, saved frame pointers, argument
slots and `sum_to`'s locals in the red zone (checked against the psABI's red
zone text). A call stack stepper island runs a new tested lifetime trace
(frames with named locals, heap objects, handles) through a callee creating a
buffer that outlives its frame, a free that leaves a dangling handle, and the
fix; it asks for a prediction before both lifetime questions. A table gives the
same events without JavaScript. The calling-convention definition now defers to
the assembly lesson. The first exercise became an attempt lab with hidden
contracts, and Exclusive Time of Functions was linked (LeetCode GraphQL metadata;
on neither published list).

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 284 tests in 45 files; 33 pages; 80 browser tests.
Screenshots of both visuals at 1280 px and 390 px in both themes, including the
dangling state, were inspected. Review caught a bug before commit: two
consecutive question steps skipped the second question; answers are now tracked
per step and a browser test checks that both questions ask.

## DRAM, SSDs and disks lesson — 2026-11-16

Draft of the planned page "DRAM, SSDs, and disks". A new native measurement,
`sweep.c`, chases pointers through a random single cycle of 64-byte nodes for
33 working-set sizes from 4 KiB to 256 MiB. A first trial, not recorded, ran
each size's repetitions back to back and showed one stretch of 200–360 ns at
12–32 MiB that a second trial did not reproduce; the program now interleaves
five rounds over all sizes in alternating order, and the recorded run
(`sweep.json`, with compiler, CPU and `lscpu --caches`) shows medians of
0.79 ns within L1d, 3.30 ns within L2, 19.9 ns within L3 and 151.8 ns beyond it,
with the last step starting near 12 MiB. Tests summarize the recording; the
native test runs the program in quick mode and checks that every chase ends at
the same node in every repetition. `--record-measurements --only sweep` records
it without rewriting the locality measurement.

Models for DRAM row hits and conflicts, disk positioning and a log-structured
flash translation layer with garbage collection are tested, including every
flash snapshot in the figure and the lesson's estimates against the recording.
The latency ladder uses Dive into Systems' figures for a typical 2020
workstation; Drepper's memory paper was registered for DRAM rows, banks and
channels after reading its access-protocol sections. Three chart color tokens
were added after the dataviz palette validator passed them, all pairs, against
`--surface` in both themes (the light aqua's contrast warning is met by direct
labels and tables).

Same command as the previous entry. The first full run failed one browser test:
the mobile catalog accessibility test took 31.9 s against its 30 s limit, after
29.4 s in an isolated rerun (12.9 s at the start of this work) and with a load
average of 6.5. It performs eight full-page captures and axe scans of pages that
grow with every lesson, so its timeout is now 90 s. The rerun passed: zero type
errors, warnings or hints; formatting and lint; 297 tests in 47 files; 34 pages;
82 browser tests. Screenshots of all five figures at 1280 px and 390 px in both
themes were inspected; review moved the sweep's axis title out of the tick
labels and hid alternate size ticks on phones.

## Memory hierarchy figures — 2026-11-16

The memory-hierarchy lesson's text card is replaced by three figures: a
hierarchy that reads cache sizes and medians from the recorded sweep and storage
rows from the sourced ladder, labelling each value measured or textbook; the
two-slot direct-mapped trace replayed from the tested cache model, showing block
2 evicting block 0 while slot 1 stays empty; and a row-versus-column walk of a
row-major matrix from a new tested traversal function (first 8 reads: 2 lines
by rows, 4 by columns). The simulator's cost paragraph moved into a disclosure.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 298 tests in 48 files; 34 pages; 82 browser tests.
Screenshots of all three figures at 1280 px and 390 px in both themes were
inspected; no layout fixes were needed beyond giving a labelled slot group an
explicit group role.

## Pipelining and hazards lesson — 2026-11-16

Draft of the planned page "Pipelining and hazards", the first lesson of the
"Inside the processor" chapter. A new tested model schedules a five-stage
in-order pipeline with optional forwarding, load-use bubbles and taken-branch
flushes, with its assumptions stated in its source. All six program and
forwarding combinations were traced by hand; that review found and fixed a bug
before commit, in which a branch stalled in ID kept fetching wrong-path
instructions instead of holding fetch. Tests check complete timelines, that no
two instructions occupy one stage in a cycle, and that completed instructions
visit all five stages in order. A static figure shows the load-use program
with forwarding off and on; a stepper island reveals the timeline one cycle at
a time, asks for a prediction of lost cycles, explains each cycle, and keeps the
newest column in view when the table scrolls. The attempt lab counts bubbles in
straight-line code against hidden contracts.

Same command as the previous entry. The first full run failed one browser test
whose expected sidebar chapters did not yet include "Inside the processor";
after updating it, the gate passed: zero type errors, warnings or hints;
formatting and lint; 315 tests in 51 files; 35 pages; 86 browser tests.
Screenshots at 1280 px and 390 px in both themes were inspected; review fixed a
323 px overflow from a grid item that grew to its table's width.

## Branch prediction and speculation lesson — 2026-11-16

Draft of the planned page "Branch prediction, speculation, and out-of-order
execution". A new native measurement compiles one C kernel, which sums bytes at
or above 128, three ways: `-O2` (vectorized), `-O1` (conditional move) and `-O2`
with vectorization and if-conversion off (a real branch). Each listing is a
drift-checked artifact; a fixed-seed harness, built at `-O2`, times random and
sorted copies of the same bytes in seven alternating rounds and checks every
sum. The recorded run (`sorted-random.json`) shows only the branch build
depending on order (about 6.2 ns per element random, 0.48 sorted); tests assert
that relationship and that only that listing contains the data-dependent jump.
The native verification gained build variants for this, and `--record` rewrote
no existing artifact.

Tested models cover one- and two-bit predictors (every counter state on the loop
stream, saturation, the alternating pattern) and a reorder buffer with in-order
or out-of-order issue and in-order commit; the attempt contracts were checked
with an independent Python implementation. Sources registered after reading:
Utah CS 6810 lecture notes (two-bit counters, reorder buffer and commit) and the
Spectre paper (variant 1 and countermeasures). The Spectre figure is conceptual
and contains no attack code.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 329 tests in 54 files; 36 pages; 90 browser tests.
The first build failed because the navigation title exceeded the schema's 40
characters; it was shortened. Screenshots of all five visuals at 1280 px and
390 px in both themes were inspected; no layout fixes were needed.

## SIMD lesson — 2026-11-16

Draft of the planned page "SIMD and data-level parallelism". The native lab
gained `simd.c` (an integer array add and a float sum) with checks in `main.c`,
run at `-O2` and `-O3`, and seven drift-checked artifacts: four listings
(vectorized and scalar add; the float sum at `-O3` with and without
`-fassociative-math`) and GCC's `-fopt-info-vec-optimized` reports, captured
from the subject folder so they name sources by relative path. The recorded
listings show the lesson's point exactly: `-O3` loads four floats per iteration
but adds them with scalar `addss` in source order, and only the reassociated
build uses packed `addps`. Tests check those instructions, the reports, vector
plans, and lane-wise binary32 sums; the attempt contracts were cross-checked with
Python, which caught one wrong expected value of mine before commit.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 341 tests in 57 files; 37 pages; 94 browser tests.
Screenshots at 1280 px and 390 px in both themes were inspected; review moved a
line break in the lane labels to before the plus sign.

## Multicore coherence and atomics lesson — 2026-11-16

Draft of the planned page "Multicore coherence, memory ordering, and atomics".
It takes the coherence, ordering and lost-update material out of
`hardware-software-interaction`, which keeps a link and a new concept check on
resume points. Locks, condition variables and deadlock stay with the
operating-systems subject.

Tested models cover MESI for one line and two cores (Drepper section 3.3.4
transitions, including the silent Exclusive-to-Modified write), ownership
requests for alternating writers on one line or padded, release/acquire as
one-way barriers (kernel memory-barriers documentation) applied to the
message-passing and store-buffering tests, and all 20 interleavings of two
increments. The attempt contracts and both litmus tests were cross-checked
with an independent Python implementation.

The native lab gained `atomics.c` (GCC `__atomic` builtins; the AArch64 cross
compiler has no `<stdatomic.h>` in this setup) with `atomics_main.c`, which runs
2,000 publish/consume rounds and two threads of a million atomic increments
each at `-O0` and `-O2` with `-pthread` (checked programs can now take extra
flags), and six drift-checked listings. They show release and acquire as plain
`movl` on x86-64 and `stlr`/`ldar` on AArch64, a sequentially consistent store
as `xchgl`, and the relaxed fetch-and-add as `lock addl`. AArch64 `count_hit`
calls an outline-atomics helper and is not shown. `false_sharing.c` was
recorded (seven alternating rounds, 10⁸ increments per thread, threads not
pinned): median 1.25 ns per increment with the counters 8 bytes apart and 0.23
ns 64 bytes apart; tests assert only a ratio above three.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 356 tests in 59 files; 38 pages; 98 browser tests.
The first run failed because the lesson had two concept checks and the test
expects one; the moved coherence check was dropped. Screenshots of the stepper
(initial and after four accesses) and the three figures at 1280 px and 390 px
in both themes were inspected; review added per-step values to the lost-update
trace, kept litmus outcomes on one line, and rewrote the stepper's effect
sentences.
