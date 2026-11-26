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

## Hardware–software boundary figure — 2026-11-16

`hardware-software-interaction` replaces its text-card figure with a user/kernel
sequence diagram: a system call, a restartable fault and an interrupt at the
same instruction, each showing the handler, the saved resume point and the
return, with every index computed by the lesson's tested model. The ABI
paragraph now links to the calling-convention section instead of restating it.
The first exercise became an attempt lab (`pnpm lab
computer-architecture-execution/hardware-software-interaction`) with eight
hidden contract cases, including index 0 and an unrepresentable resume index;
the reference model passes them in the ordinary gate and the starter throws
until implemented.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 364 tests in 60 files; 38 pages; 98 browser tests. Screenshots at
1280 px and 390 px in both themes were inspected; review moved the handler box
so the entry and return arrows attach to the event and the resume point, and
shortened labels that clipped at 390 px.

## I/O mechanisms figures — 2026-11-16

`io-mechanisms` replaces its text-card figure with a DMA ownership stepper: the
learner chooses submit, complete, fail or reclaim events, predicts the buffer's
owner first, and sees each event in driver, device and buffer lanes, with an
early reclaim refused by the tested model. A numbered list after it gives the
same sequence without JavaScript. A polling-versus-interrupt timeline renders
`pollingDetection` and `interruptDetection` (new, tested) for one device ready
at time 10, in illustrative units. The polling paragraph now reflects what
OSTEP chapter 36 says about interrupt floods, two-phase waiting and coalescing
(chapter text read for this change). The first exercise became an attempt lab
with nine contract cases, cross-checked in Python. Design Circular Queue is
linked; the NeetCode data lists it in no tracked list.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 378 tests in 61 files; 38 pages; 100 browser tests, including a
keyboard test of the stepper. The first run failed the formatting check after a
late class rename. Screenshots of both visuals at 1280 px and 390 px in both
themes, and of the stepper after four events, were inspected; review gave
interrupts their own marker instead of the polling check dot.

## Architecture and performance revision — 2026-11-16

`architecture-and-performance` no longer repeats chapter 4: the pipeline,
hazard, speculation, SIMD and false-sharing sections and the pipeline-schedule
table are replaced by a table mapping each mechanism (with links to its lesson)
to the CPU-time term it mainly changes. Two figures were added: the worked
CPU-time comparison as a table with bars, every value and the caption's
percentages computed by `cpuSeconds`, and a strip plot of all twelve locality
observations, read from `measurement.json` with a table equivalent. The prose
no longer hand-copies timings. Two interview questions that duplicated other
lessons were replaced, and the first exercise became an attempt lab with nine
contract cases.

The locality measurement was re-recorded on an idle machine (`--record-measurements
--only architecture-and-performance`), which now stores `lscpu --caches`. The
16 MiB matrix is smaller than the 24 MiB L3 it reports, so the lesson no longer
implies the column walk reaches DRAM; it names L1/L2 and TLB misses as an
untested hypothesis, since no counters were collected. A new test asserts the
recorded relationship the prose states: every column-order run slower than
every row-order run. The recorder's JSON needed Prettier before the gate passed.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 388 tests in 62 files; 38 pages; 100 browser tests.
Screenshots of both figures at 1280 px and 390 px in both themes were
inspected; review compacted the CPU-time table, which scrolled sideways at
390 px.

## Measuring performance lesson — 2026-11-16

Draft of the planned page "Measuring performance with benchmarks and hardware
counters", the last planned page in this subject. It takes the benchmark
checklist from `architecture-and-performance`, which now links to it.

`timing.c` (new, in the native lab's measurements) sums one 4 MiB array sixty
times, alternating runs after a 64 MiB eviction sweep with runs that find the
array just read, and checks every sum. Recorded on an idle machine: warm median
0.240 ns per element, cold 0.294, with overlapping ranges; tests assert the
relationships the prose states (medians ordered, ranges overlapping, each
series' slowest run over 1.5 times its fastest, the pairing share strictly
between one half and one). The figure renders the runs, p10–p90 bands and
medians from the JSON.

The roofline chart uses an illustrative machine (100 GFLOP/s, 50 GB/s), labelled
as such, with three float kernels at exact intensities. Counters are taught with
one labelled illustrative IPC calculation and no counter output: `perf` is not
installed here (`which perf` found nothing). `perf-counters.sh` is for the owner
to run on native Linux; only its missing-`perf` exit is tested, with an empty
search path. Its `perf stat` options (`-e`, `-r`, `-o`, `--append`) were checked
against the manual page. Sources registered after reading: the perf-stat(1)
page on man7.org and the Roofline technical report (UCB/EECS-2008-134); the old
perf wiki now redirects elsewhere and is not cited. Find Median from Data Stream
is linked; NeetCode's data marks it Blind 75 and NeetCode 150.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 405 tests in 64 files; 39 pages; 102 browser tests.
Screenshots of the three figures at 1280 px and 390 px in both themes were
inspected; review moved the roofline's line labels into a key and compacted its
table, which collided and overflowed at 390 px.

## Subject records and ArchitectureFlow retirement — 2026-11-16

No lesson uses `ArchitectureFlow` any more, so the component was deleted. The
subject overview gained objectives for multicore and measurement and now says
the `perf stat` experiment is owner-run with no recorded output. The audit
document has a correction to its 2026-11-13 follow-through note, and
`IMPLEMENTATION.md` ticks the browser-test item for the scaffolding pages (the
catalog tests cover them in every gate run) and the planned-page drafting
item, adding an open item for owner review.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 405 tests in 64 files; 39 pages; 102 browser tests.
The native drift check, run on its own afterwards, reported all 28 artifacts
unchanged and 8 checked programs passing.

## I/O lab contract fix — 2026-11-16

Two of the I/O attempt lab's nine contract cases expected only "throws an
Error", which the unimplemented starter also satisfied. The contract now
requires the error message to name the refused event and the request's phase,
as the reference model's messages already do. `pnpm lab
computer-architecture-execution/io-mechanisms` now fails all nine cases before
an attempt (it failed seven), and the reference passes them.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 405 tests in 64 files; 39 pages; 102 browser tests.

## Local toolchain setup scripts — 2026-11-17

The compiler and browser libraries used for the architecture work were no
longer under `/tmp`. GCC 15.2 was rebuilt with the existing
`native/setup-gcc-ubuntu.sh /tmp/anvaya-cc`. Two setups that had only been
described in this record are now scripts that extract Ubuntu 26.04 packages
without root: `scripts/setup-browser-deps.sh` (libnspr4, libnss3, ALSA for
Playwright's Chromium) and `native/setup-gcc-arm64-ubuntu.sh` (the aarch64
cross-compiler for `-S` listings). Both compilers report
`(Ubuntu 15.2.0-16ubuntu1) 15.2.0`, matching `toolchain.json`, and `ldd` finds
every Chromium library with the extracted folder on `LD_LIBRARY_PATH`.

```sh
PLAYWRIGHT_PORT=4371 \
  LD_LIBRARY_PATH=/tmp/anvaya-browser-deps/usr/lib/x86_64-linux-gnu \
  ANVAYA_CC=/tmp/anvaya-cc/compiler ANVAYA_CC_ARM64=/tmp/anvaya-cc-arm64/compiler \
  pnpm verify
```

Baseline on unchanged content: zero type errors, warnings or hints; formatting
and lint passed; 405 tests in 64 files; 39 pages; 102 browser tests. The native
drift check, run on its own, reported all 28 artifacts unchanged (ARM64
included), 8 checked programs passing and 5 measurements validated.

## Subject standard and ADR 0009 — 2026-11-17

`docs/SUBJECT_STANDARD.md` writes down the bar set by Computer Architecture &
Execution as 56 numbered properties in six groups (curriculum, lesson anatomy,
visuals, evidence, practice, process), each naming what checks it. The
properties were taken from the subject's lessons and labs, the 2026-11-13 audit
and its correction, this record's architecture entries and the fix commits of
PR #9 (for example: reveal answers only after the attempt, keep answers out of
figures, number labs consecutively, and require a specific error in refusal
contracts). The promotion checklist moved from `LEARNING_STANDARDS.md` into
the standard, and that file was removed; the README, the review playbook and
`AGENTS.md` now link the standard, and the dated audit's link points to the
file at the audited commit. ADR 0009 records the decision. Nothing in this
change is enforced yet; the report and browser checks it names arrive in
later changes.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 405 tests in 64 files; 39 pages; 102 browser tests.

## Subject report — 2026-11-17

`pnpm subject:report <subject>[/<lesson>] [--json]` (`scripts/subject-report.ts`,
run by Node's built-in type stripping) inventories a subject against the
standard's IDs: chapters and planned topics, duplicate planned titles across
paths, lessons missing from any path, and for each lesson its minutes,
objectives, interview questions, sources, predict prompts and whether the next
block gates the answer, check-after disclosures, the tested model disclosure,
LabCard numbering and commands, ConceptChecks, recap bullets, imported figures
and whether they read from `labs/`, whether each verified output's lines appear
in a lab test, lab files, hidden contract cases and bare `toThrow()` calls, and
linked problems. It is advisory and never fails the gate. `yaml` 2.9.1, already
used by Astro, became a direct development dependency.

Ten unit tests cover a lesson that meets the standard (no flags), an answer
given in prose after a prompt, "predictor" not counting as a prompt, missing
frontmatter, contract counting, the minute thresholds, numbering, missing labs
and unasserted outputs, and a temporary repository with an unlisted lesson and
a planned title duplicated across subjects.

On the current content it agrees with the hand survey made while planning:
13 of 19 architecture lessons are above 30 minutes and three above 45; the
three lab folders that differ from their slugs; `measuring-performance` has no
lab README; `AmdahlBars`, `InstructionFields` and `CachePlacement` import no
lab model; `memory-hierarchy-and-caches` has two contract cases. On the outline
subjects it reports "Replication and partitioning" planned under both databases
and distributed systems. Its signals are prompts for an audit, not findings:
for example `MeasureWorkflow` and `SpectreSteps` are concept figures with no
values to compute.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 102 browser tests.

## Per-lesson browser checks for every lesson — 2026-11-17

The per-lesson checks that `tests/e2e/architecture.spec.ts` ran over a
hard-coded list of 19 slugs now live in `tests/e2e/lessons.spec.ts`, which
finds every `.mdx` file under `src/content/lessons`. For each lesson, in both
projects, it checks a visible `.diagram-frame`, no horizontal overflow and an
axe scan (WCAG 2.2 AA tags) in light and dark themes, that the "Inspect the
tested model" disclosure opens by keyboard and shows code, and that there is
exactly one concept check (new) whose correct answer is accepted by keyboard.
With JavaScript disabled, it checks every lesson's figure, recap, overflow and
disclosure. `dsa/arrays` and `dsa/hash-maps` are excluded as known exceptions
to the standard. The subject spec keeps its twelve widget keyboard tests; its
unasserted `cpu-registers-and-instructions` screenshot was dropped in favour
of `pnpm shots`. A new subject's lessons are now covered without editing a
test list.

Same command as the previous entry, with this change and the screenshot script
of the next entry in the tree: zero type errors, warnings or hints; formatting
and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests (the two
new ones confirm the spec found its lessons).

## Screenshot review script — 2026-11-17

`pnpm shots <subject>/<lesson> [--select css] [--port n]` replaces the
uncommitted scratchpad script used during the architecture work. Against the
built site served by `astro preview`, it captures each `.diagram-frame` and
each hydrated widget at 1280 px and 390 px in light and dark themes (theme set
through `anvaya:theme:v1`, reduced motion, fonts loaded, the sticky header made
static), plus the whole page at 390 px without JavaScript, and writes
`report.json` with page overflow, up to five elements wider than the viewport
outside scroll regions, and console errors. Output goes to the ignored
`screenshots/` folder, and the command exits non-zero when the report finds a
problem.

Run on `computer-architecture-execution/cache-organization`: two captures per
width and theme (the placement figure and the cache explorer), zero overflow,
no errors; the 1280 px light placement figure and the 390 px dark explorer were
opened and read correctly. The first run failed because `astro-island` uses
`display: contents` and has no box; the script now captures the island's first
child. Gate results are in the previous entry, which ran with this script in
the tree.

## Lab and lesson templates in the attempt pattern — 2026-11-17

`templates/lab/` now produces the architecture lab pattern instead of a
`solution.ts` lab with visible cases: a README titled "Independent practice",
`contracts(solve)` with five hidden "unseen case N" contracts including a
refusal that expects `RangeError`, a starter that throws
`Implement your attempt`, `exercises.attempt.test.ts`, a `practice.test.ts`
that runs the contracts against the reference, and `example.ts` with an
`*Example()` output asserted by `example.test.ts`. `templates/lesson.mdx`
follows the standard's anatomy (hook with the analogy's limit, figure,
predict and check-after disclosure, worked example, tested model disclosure,
`## Practice` with card `01 /`, a three-option concept check, recap). `pnpm
new:lesson` always creates the lab (`--lab` is no longer needed) and its next
steps name the report, the failing attempt, the gate and the screenshots. The
placeholder lint now checks every lab `.ts`, `.c`, `.sh` and `.mjs` file except
`starter.ts`; the existing labs pass it.

Scaffolding `computer-architecture-execution/zz-scaffold-check` (then deleted):
the placeholder lint reported 37 markers; `pnpm lab` failed all 5 contracts;
the reference passed its 7 tests; the tools type check passed.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.
Prettier then turned the template's two-line MDX comment into emphasis; it is
now two one-line comments, and the format check passed again. Templates are not
part of the build.

## Guidance aligned with the subject standard — 2026-11-17

`AGENTS.md`, the playbooks, the authoring guide, the design system, the README
and `IMPLEMENTATION.md` now agree with the standard. New
`docs/playbooks/verify-change.md` holds the environment setup, the gate
command, the screenshot review and its recurring problems from PR #9, the test
lists that still need hand updates, the verification entry's structure and the
commit conventions. `add-lesson.md` names the architecture lessons as
references, requires a lab and builds it first, and replaces "link 3–6
problems" with linking only genuine ones. `add-interactive.md` points figures
and widgets at tested lab models instead of `src/lib/`. `add-problem.md` adds
the bank metadata and paid-only checks used in PR #9; `add-source.md` requires
opening every cited page; `add-subject-or-path.md` plans a curriculum through a
proposal before drafting; `review-content.md` starts from the report and the
standard. The authoring guide gains the `c` and `text` languages, LabCard
numbering, the lab layout and the new commands. ADR 0008's status is accepted,
as PR #9 merged it, and `IMPLEMENTATION.md` no longer describes those drafts as
unpushed. A search for `--lab`, "3–6 practice", "solution.ts",
`LEARNING_STANDARDS` and the old `lint && test && build` gate in the guidance
found nothing left.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## audit-subject skill — 2026-11-17

`.claude/skills/audit-subject/` scores a subject, chapter or lesson against the
standard: inventory from `pnpm subject:report`, full reading of the scope,
pass/partial/fail/n/a per ID with file:line evidence (`rubric.md`), P0–P3
priorities, a curriculum-only mode for subjects without lessons, a "standard
feedback" section for properties that seem wrong, and the document structure
in `audit-template.md`, modelled on the 2026-11-13 architecture audit.
`AGENTS.md` gains a skills table so other agents can follow the same files.
The skill is exercised by the audits recorded later on this branch.

Same command as the previous entry, with only this skill in `.claude/skills/`:
zero type errors, warnings or hints; formatting and lint passed; 415 tests in
65 files; 39 pages; 104 browser tests.

## draft-lesson skill — 2026-11-17

`.claude/skills/draft-lesson/` drafts one lesson in the order the architecture
work settled on (scaffold, lab and its cross-check, native evidence, figures
from the model, prose, sources and genuine problems, neighbours), then runs a
pre-commit self-review (`checklist.md`) that turns the PR #9 fix commits into
checks, verifies and records with `verify-change.md`, commits the lesson alone
and reports verified facts separately from items for the owner. It drives
`add-lesson.md` rather than restating it.

Same command as the previous entry, with the audit and draft skills in the
tree: zero type errors, warnings or hints; formatting and lint passed; 415
tests in 65 files; 39 pages; 104 browser tests.

## enhance-lesson skill — 2026-11-17

`.claude/skills/enhance-lesson/` makes small changes to one lesson while the
owner studies it: restate the request, read the lesson with its lab, tests,
components and history, pick the single teaching home or propose a split, then
apply a recipe (`recipes.md`) that lists everything that moves together for a
point, figure, worked example, lab case, practice task, problem, interview
question or source, and for bringing a legacy lesson up to the standard
(including removing it from the browser spec's exception list).

Same command as the previous entry, with the audit, draft and enhance skills in
the tree: zero type errors, warnings or hints; formatting and lint passed; 415
tests in 65 files; 39 pages; 104 browser tests.

## create-subject skill — 2026-11-17

`.claude/skills/create-subject/` plans and builds a subject in five phases:
intake (`intake.md`, three batches of questions on goals, level, roles,
depth, toolchains, hardware, exclusions, sources, time and checkpoints, each
tied to the outline decision it drives) with no repository changes; survey and
research; a proposal in `docs/proposals/<subject>.md` from
`outline-template.md`, committed on its own, then a stop for approval; one
planning change to the path and subject YAML; and draft-lesson for each page
with a checkpoint after every lesson and audit-subject after every chapter.
The skills table in `AGENTS.md` now lists all four, and `IMPLEMENTATION.md`
ticks the skills item.

Same command as the previous entry, with all four skills in the tree: zero
type errors, warnings or hints; formatting and lint passed; 415 tests in 65
files; 39 pages; 104 browser tests.

## Operating Systems & Runtime Internals outline audit — 2026-11-17

First run of the audit-subject skill in its curriculum-only mode:
`docs/reviews/operating-systems-runtime-internals-audit-2026-11-17.md` scores C1–C8 and feasibility for the
subject's outline at `6d48b46` (P0 0, P1 2, P2 3, P3 1). Its inventory came from
`pnpm subject:report operating-systems-runtime-internals`; tool availability was checked with `command -v`
and `apt-cache policy`. Candidate sources it names were not opened and are
marked as unverified suggestions; the only external pages fetched during these
audits were the Google SRE books index and two chapter URLs (HTTP 200), which
show the registered `google-sre-books` prefix cannot match chapter citations.
No content changed.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Computer Networking outline audit — 2026-11-17

First run of the audit-subject skill in its curriculum-only mode:
`docs/reviews/computer-networking-audit-2026-11-17.md` scores C1–C8 and feasibility for the
subject's outline at `6d48b46` (P0 0, P1 2, P2 3, P3 1). Its inventory came from
`pnpm subject:report computer-networking`; tool availability was checked with `command -v`
and `apt-cache policy`. Candidate sources it names were not opened and are
marked as unverified suggestions; the only external pages fetched during these
audits were the Google SRE books index and two chapter URLs (HTTP 200), which
show the registered `google-sre-books` prefix cannot match chapter citations.
No content changed.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Databases & Storage Systems outline audit — 2026-11-17

First run of the audit-subject skill in its curriculum-only mode:
`docs/reviews/databases-storage-systems-audit-2026-11-17.md` scores C1–C8 and feasibility for the
subject's outline at `6d48b46` (P0 0, P1 2, P2 3, P3 1). Its inventory came from
`pnpm subject:report databases-storage-systems`; tool availability was checked with `command -v`
and `apt-cache policy`. Candidate sources it names were not opened and are
marked as unverified suggestions; the only external pages fetched during these
audits were the Google SRE books index and two chapter URLs (HTTP 200), which
show the registered `google-sre-books` prefix cannot match chapter citations.
No content changed.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Software Engineering & Architecture outline audit — 2026-11-17

First run of the audit-subject skill in its curriculum-only mode:
`docs/reviews/software-engineering-architecture-audit-2026-11-17.md` scores C1–C8 and feasibility for the
subject's outline at `6d48b46` (P0 0, P1 3, P2 2, P3 1). Its inventory came from
`pnpm subject:report software-engineering-architecture`; tool availability was checked with `command -v`
and `apt-cache policy`. Candidate sources it names were not opened and are
marked as unverified suggestions; the only external pages fetched during these
audits were the Google SRE books index and two chapter URLs (HTTP 200), which
show the registered `google-sre-books` prefix cannot match chapter citations.
No content changed.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Distributed Systems outline audit — 2026-11-17

First run of the audit-subject skill in its curriculum-only mode:
`docs/reviews/distributed-systems-audit-2026-11-17.md` scores C1–C8 and feasibility for the
subject's outline at `6d48b46` (P0 0, P1 2, P2 3, P3 1). Its inventory came from
`pnpm subject:report distributed-systems`; tool availability was checked with `command -v`
and `apt-cache policy`. Candidate sources it names were not opened and are
marked as unverified suggestions; the only external pages fetched during these
audits were the Google SRE books index and two chapter URLs (HTTP 200), which
show the registered `google-sre-books` prefix cannot match chapter citations.
No content changed.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Security, Performance & Reliability outline audit — 2026-11-17

First run of the audit-subject skill in its curriculum-only mode:
`docs/reviews/security-performance-reliability-audit-2026-11-17.md` scores C1–C8 and feasibility for the
subject's outline at `6d48b46` (P0 0, P1 3, P2 2, P3 1). Its inventory came from
`pnpm subject:report security-performance-reliability`; tool availability was checked with `command -v`
and `apt-cache policy`. Candidate sources it names were not opened and are
marked as unverified suggestions; the only external pages fetched during these
audits were the Google SRE books index and two chapter URLs (HTTP 200), which
show the registered `google-sre-books` prefix cannot match chapter citations.
No content changed.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## create-subject dry run: Operating Systems & Runtime Internals — 2026-11-17

The create-subject skill's first run, stopped after Phase 3 as requested:
three intake batches and a summary read-back with the owner (who chose three
full runtime case studies over the agent's two-deep, one-light suggestion, and
dropped Python), then `docs/proposals/operating-systems-runtime-internals.md`:
38 pages in 10 chapters (965 minutes), a coverage map, two running threads, a
toolchain and evidence plan, a duplication table, decisions for the owner and
risks. No path, subject or lesson file changed. The proposal resolves the
outline audit's findings: broad titles split, the architecture boundary
stated, containers and signals added.

Thirty-three candidate source pages were fetched and returned HTTP 200 with the
expected titles (OSTEP chapters, man7 pages, kernel cgroup-v2, EEVDF and memory
concepts, Node.js, libuv, V8, Oracle GC tuning and JVM specification, JEPs 439
and 444, `jcmd`, Go GC guide, memory model, runtime package and `proc.go`'s
scheduler comment, Brendan Gregg's USE method and flame graphs, Python free
threading). They were not read in depth per claim; the proposal says so. Tool
availability was checked: `strace`, OpenJDK 21 and Go 1.26/1.24 are available
as Ubuntu packages to extract; `perf` is not; Docker's daemon answers.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Computer Architecture & Execution audit against the standard — 2026-11-17

The audit-subject skill's full mode on the reference subject:
`docs/reviews/computer-architecture-execution-audit-2026-11-17.md` scores all
56 properties (41 pass, 14 partial, 1 fail) and lists 13 findings (P0 0, P1 1,
P2 6, P3 6) and four items of standard feedback for the owner. All 53 report
flags were read at their lines. Three were false signals (two prose uses of
"predict", and concept figures with nothing to compute). The report also
missed five answer reveals that sit after a widget, which the audit found by
reading. `pnpm shots` ran on all 19 lessons: 251 captures, no overflow or
console errors; the four opened images found one label collision in the DRAM
sweep at 390 px. Counts in the audit were taken from `pnpm subject:report
--json`, after correcting three hand-written totals in the first draft
(minutes, figures and verified outputs). No content changed.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Standard adjusted after the architecture audit — 2026-11-17

The owner decided the audit's standard feedback. C4 keeps 15–30 minutes as the
target, accepts 31–45 for a page that is still one mechanism, and requires a
split above 45; `pnpm subject:report` now reports 31–45 as information rather
than a warning (its test was updated), and the playbook, authoring guide and
skills say the same. L9 accepts wording other than "The tests check" that says
what the tests assert. P1 records the three existing architecture lab folders
as known exceptions. L10 is unchanged: making `LabCard`'s `command` optional,
as the owner chose, is left for a follow-up component change with its own
browser test. The audit gained a dated "Owner decisions" section; its findings
were not rewritten.

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Review fixes for the subject standard tooling — 2026-11-19

Fixes from a code review of this branch:

- **`pnpm shots`:** the preview now starts with `--ignore-lock`, like
  `playwright.config.ts`. Before this fix, Astro 7 ran it as a background
  server that outlived the script, and any later run on another port failed
  with "Preview did not start". The script now also stops the preview on
  Ctrl-C, and refuses to start when something already serves the port.
- **`pnpm subject:report`:** an unknown lesson or chapter is now an error
  instead of an empty report. A new chapter scope, `<subject>#<section-id>`,
  serves audit-subject's chapter audits. Lesson and chapter reports no longer
  carry subject-wide flags. Parsing fixes:
  - A lab card after a prompt now counts as a gate.
  - Output escapes are resolved in one pass.
  - Attributes containing `>` are read correctly.
  - `verified={false}` is not counted as verified.
  - Duplicate planned titles keep their parentheses.
- **Skills and standard:** audit-subject redirects JSON with `pnpm -s`.
  enhance-lesson follows C4 (split above 45 minutes). L8 again requires
  complexity and cost claims to name their assumptions, which was dropped with
  `LEARNING_STANDARDS.md`. V7 is marked manual, since the report has no V7
  check.
- **Setup scripts:** all three resolve their folder to an absolute path, so a
  relative argument works.
- **Browser and unit tests:** the no-JavaScript browser check runs once per
  lesson instead of in one loop. The unit test's temporary repository is
  created in `beforeAll`.

On the current content the subject report is unchanged: 53 flags for
Computer Architecture & Execution. Five new unit tests cover the parsing
fixes, the chapter scope and the unknown-target errors. With a dummy local
package, both browser and ARM64 setup scripts now work with a relative folder,
and all three setup scripts recreated the toolchain used below. `pnpm shots`
on `cache-organization` ran twice, on ports 4361 and 4362, and once
interrupted; no preview process was left afterwards.

`PLAYWRIGHT_PORT=4371`, `LD_LIBRARY_PATH`, `ANVAYA_CC` and `ANVAYA_CC_ARM64`
set, then `pnpm verify`: zero type errors, warnings or hints; formatting and
lint passed; 420 tests in 65 files; 39 pages; 140 browser tests (38 are the
per-lesson no-JavaScript checks that replace the two looping tests). The
native drift check, run on its own, reported all 28 artifacts unchanged.

## Program execution: answers after the attempt — 2026-11-17

Fixes finding F1 of the 2026-11-17 architecture audit with the enhance-lesson
skill. The datapath stepper's no-JavaScript trace table and its explanation now sit in a "Check after stepping" disclosure, and the accumulator program's branch timeline and run explanation in a "Check after predicting" one; the static and dynamic instruction count definitions stay visible. Beyond what this entry names, no explanation, figure,
lab or test value changed; the material moved behind the attempt (standard L6).

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## CPU, registers and instructions: answers after the attempt — 2026-11-17

Fixes finding F1 of the 2026-11-17 architecture audit with the enhance-lesson
skill. The "Predict" about adding one to a register holding an address no longer answers itself; the answer moved into a "Check after predicting" disclosure. Beyond what this entry names, no explanation, figure,
lab or test value changed; the material moved behind the attempt (standard L6).

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Text encodings and memory layout: answers after the attempt — 2026-11-17

Fixes finding F1 of the 2026-11-17 architecture audit with the enhance-lesson
skill. The struct-layout answer (24 bytes declared, 16 sorted) and the real ABI's output now follow the explorer in a "Check after predicting" disclosure; the reordering trade-offs stay visible. Beyond what this entry names, no explanation, figure,
lab or test value changed; the material moved behind the attempt (standard L6).

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Reading assembly: answers after the attempt — 2026-11-17

Fixes finding F1 of the 2026-11-17 architecture audit with the enhance-lesson
skill. The -O2 loop's iteration table, which answered how often jne jumps back, is now the stepper's no-JavaScript equivalent inside a "Check after stepping" disclosure. Beyond what this entry names, no explanation, figure,
lab or test value changed; the material moved behind the attempt (standard L6).

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Stack and heap: answers after the attempt — 2026-11-17

Fixes finding F1 of the 2026-11-17 architecture audit with the enhance-lesson
skill. The call-stack event table and the lifetime explanation after the stepper are now in a "Check after stepping" disclosure. Beyond what this entry names, no explanation, figure,
lab or test value changed; the material moved behind the attempt (standard L6).

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Cache organization: answers after the attempt — 2026-11-17

Fixes finding F1 of the 2026-11-17 architecture audit with the enhance-lesson
skill. The 2-way hit/miss trace after the cache explorer is now in a "Check after stepping" disclosure. Beyond what this entry names, no explanation, figure,
lab or test value changed; the material moved behind the attempt (standard L6).

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Pipelining and hazards: answers after the attempt — 2026-11-17

Fixes finding F1 of the 2026-11-17 architecture audit with the enhance-lesson
skill. The reordered program's cycle count after the stepper is in a "Check after stepping" disclosure, and the following sentence about compiler scheduling no longer depends on it. Beyond what this entry names, no explanation, figure,
lab or test value changed; the material moved behind the attempt (standard L6).

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Multicore coherence and atomics: answers after the attempt — 2026-11-17

Fixes finding F1 of the 2026-11-17 architecture audit with the enhance-lesson
skill. The MESI transitions table and which accesses need ownership requests now sit in a "Check after stepping" disclosure after the stepper. The per-lesson browser check now requires the first visible figure, since this lesson's first figure moved into a disclosure. Beyond what this entry names, no explanation, figure,
lab or test value changed; the material moved behind the attempt (standard L6).

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## I/O mechanisms: answers after the attempt — 2026-11-17

Fixes finding F1 of the 2026-11-17 architecture audit with the enhance-lesson
skill. The four-step DMA ownership sequence after the stepper is now in a "Check after stepping" disclosure; the visibility and coherence caveats stay visible. Beyond what this entry names, no explanation, figure,
lab or test value changed; the material moved behind the attempt (standard L6).

Same command as the previous entry: zero type errors, warnings or hints;
formatting and lint passed; 415 tests in 65 files; 39 pages; 104 browser tests.

## Optional LabCard command — 2026-11-25

Audit finding F4 and owner decision S2: `LabCard`'s `command` is optional, and
a card without one renders no "Run locally" footer. The four paper tasks the
audit named (hardware-software interaction 02, I/O mechanisms 02, DRAM 02,
architecture and performance 03) no longer show a reference-test command.
Architecture and performance 02 keeps its command: it is a calculation against
the tested model, which the audit did not flag. The subject report reads a
missing command as empty and words the card-01 warning for that case.

`pnpm verify` without the toolchain variables: zero type errors, warnings or
hints; formatting and lint passed; 421 tests passed and 1 skipped in 65 files
(the native drift check, which needs `ANVAYA_CC`); 39 pages; 142 browser tests,
including the new paper-task card check on desktop and mobile. Two new unit
tests cover a command-less card and a command-less first card.

## Compilation and execution: predict before practice — 2026-11-25

Fixes finding F3 of the 2026-11-17 architecture audit with the enhance-lesson
skill (standard L5). Before the relocation figure, the learner now predicts which two addresses the linker needs to patch the call to `sum_to`; the answer (the symbol's address and the patched bytes' address, because the call stores a distance) is in a "Check after predicting" disclosure. It restates what the next section and `relocation.test.ts` already establish. Beyond what this entry names, no explanation, figure,
lab or test value changed. `pnpm subject:report` no longer raises L5 for the
lesson and raises no new flag.

`pnpm verify` without the toolchain variables, run once on all five F3 lessons
together: zero type errors, warnings or hints; formatting and lint passed; 421
tests passed and 1 skipped in 65 files (the native drift check, which needs
`ANVAYA_CC`); 39 pages; 142 browser tests. No figure changed, so no
screenshots were taken.

## DRAM, SSDs and disks: predict before practice — 2026-11-25

Fixes finding F3 of the 2026-11-17 architecture audit with the enhance-lesson
skill (standard L5). Before the working-set sweep, the learner now predicts where the time per load steps up, from the recorded 48 KiB L1d, 3 MiB L2 and 24 MiB L3 (`sweep.json`) over the sweep's 4 KiB–256 MiB range. The disclosure gives the capacities and the early last step the figure notes already explain. Beyond what this entry names, no explanation, figure,
lab or test value changed. `pnpm subject:report` no longer raises L5 for the
lesson and raises no new flag.

`pnpm verify` without the toolchain variables, run once on all five F3 lessons
together: zero type errors, warnings or hints; formatting and lint passed; 421
tests passed and 1 skipped in 65 files (the native drift check, which needs
`ANVAYA_CC`); 39 pages; 142 browser tests. No figure changed, so no
screenshots were taken.

## Hardware-software interaction: predict before practice — 2026-11-25

Fixes finding F3 of the 2026-11-17 architecture audit with the enhance-lesson
skill (standard L5). The resume indices for a syscall, a restartable fault and an interrupt at index 12 were stated before the model; the learner now predicts them, and the existing sentences moved into a "Check after predicting" disclosure. The model's verified output prints the same three. Beyond what this entry names, no explanation, figure,
lab or test value changed. `pnpm subject:report` no longer raises L5 for the
lesson and raises no new flag.

`pnpm verify` without the toolchain variables, run once on all five F3 lessons
together: zero type errors, warnings or hints; formatting and lint passed; 421
tests passed and 1 skipped in 65 files (the native drift check, which needs
`ANVAYA_CC`); 39 pages; 142 browser tests. No figure changed, so no
screenshots were taken.

## Architecture and performance: predict before practice — 2026-11-25

Fixes finding F3 of the 2026-11-17 architecture audit with the enhance-lesson
skill (standard L5). Before the locality strip, the learner now predicts which loop order is faster and whether the times overlap. The disclosure says row order, with no overlap in this recording, which `example.test.ts` asserts (every column-order sum slower than every row-order sum). Beyond what this entry names, no explanation, figure,
lab or test value changed. `pnpm subject:report` no longer raises L5 for the
lesson and raises no new flag.

`pnpm verify` without the toolchain variables, run once on all five F3 lessons
together: zero type errors, warnings or hints; formatting and lint passed; 421
tests passed and 1 skipped in 65 files (the native drift check, which needs
`ANVAYA_CC`); 39 pages; 142 browser tests. No figure changed, so no
screenshots were taken.

## Measuring performance: predict before practice — 2026-11-25

Fixes finding F3 of the 2026-11-17 architecture audit with the enhance-lesson
skill (standard L5). Before the timing distribution, the learner now predicts whether every cold run is slower than every warm run. The disclosure says the ranges overlap because the cold penalty is smaller than the run-to-run spread; `stats.test.ts` now also asserts that the median gap is smaller than either series' range (0.054 against about 0.18 ns per element). Beyond what this entry names, no explanation, figure,
lab or test value changed. `pnpm subject:report` no longer raises L5 for the
lesson and raises no new flag.

`pnpm verify` without the toolchain variables, run once on all five F3 lessons
together: zero type errors, warnings or hints; formatting and lint passed; 421
tests passed and 1 skipped in 65 files (the native drift check, which needs
`ANVAYA_CC`); 39 pages; 142 browser tests. No figure changed, so no
screenshots were taken.

## Memory hierarchy: a hidden cache contract — 2026-11-25

Fixes finding F5 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard P2, P5). The attempt lab's contract grows from
two cases to seven: the two existing streams, a line boundary (addresses 15 and
16, 31 and 32), an empty stream, a conflict in slot 0 while slot 1 keeps its
line, and two refusals that expect a `RangeError` (a negative address after a
valid one; a fractional address and 2⁵³). The practice card now states the
contract, including the refusal, and names the kinds of hidden case without
their inputs; the learner traces a new stream, 32, 36, 0, 48, 32, by hand. Its
reveal is now a "Check after attempting" disclosure (the summary read "Check
the reasoning after attempting", which the subject report did not count) and
explains that trace and the 4×4 matrix addresses it already gave. Two new model
tests assert the trace's blocks, slots and results, and the matrix addresses
and line counts.

Cross-check: a separate Python implementation of a cold two-slot, 16-byte
direct-mapped cache, written from the definition, gives every contract value and
the practice trace, refuses the three invalid addresses, and reproduces the
lesson's displayed trace (miss hit hit hit miss miss); each value was also
traced by hand. `pnpm vitest run
labs/computer-architecture-execution/memory-hierarchy-and-caches/` passes 15
tests in 3 files, and `pnpm lab
computer-architecture-execution/memory-hierarchy-and-caches` fails all 7 cases
against the starter (the refusal cases because the starter's `Error` is not a
`RangeError`). `pnpm subject:report` now counts 7 cases and one check-after
reveal and no longer raises P2 for the lesson. Its other flags belong to later
findings (C4, L3, L9, L10), and its L6 flag is the audit's known false signal
at "…to predict whole-program time".

The gate's toolchain was rebuilt in this container, which runs Ubuntu 24.04,
with the scripts from verify-change.md, unmodified. `APT_CONFIG` pointed
`apt-get download` at private package lists: noble for
`scripts/setup-browser-deps.sh`, and Ubuntu 26.04 (`resolute`), which has
`gcc-15 15.2.0-16ubuntu1`, for both GCC setup scripts. Both compilers report
`(Ubuntu 15.2.0-16ubuntu1) 15.2.0`. `toolchain.json` also records binutils 2.46,
the system binutils where the artifacts were recorded, while this container's
is 2.42, so the runner would have reported every x86-64 comparison as
skipped. Binutils 2.46 from the same archive was therefore extracted into
`/tmp/anvaya-binutils` and put first on `PATH`: GCC then assembles and links
with it (`-print-prog-name`, `-Wl,-v`), and the runner's `objdump` and `nm`
report 2.46. The native runner on its own found all 28 artifacts the same,
checked 8 programs and validated 5 measurements, and the unchanged branch
passed the full gate (422 tests in 65 files, none skipped; 39 pages; 142
browser tests).

`PLAYWRIGHT_PORT=4371`, `LD_LIBRARY_PATH`, `ANVAYA_CC`, `ANVAYA_CC_ARM64` and
binutils 2.46 on `PATH`, then `pnpm verify`: zero type errors, warnings or
hints; formatting and lint passed; 429 tests in 65 files, none skipped,
including the native drift check; 39 pages; 142 browser tests. No figure
changed, so no screenshots were taken.

## Program execution: a hidden instruction-count contract — 2026-11-25

Fixes finding F5 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard P2, P5). The attempt lab's contract grows from
four cases to eight: the existing 3, 7, 19 and 0, both ends of the byte range
(1, where the branch is never taken, and 255), and refusals that expect a
`RangeError` for 256, −1 and 2.5. The practice card no longer names hidden
inputs ("Try 7 and 19"): it states the contract, including the refusal, and
asks for a hand count from 5. The reveal now explains that count (12
instructions, four taken branches and one untaken), keeps the 2n + 2 rule and
the wrap of zero to 255, and no longer prints a hidden case's expected count.
A new model test asserts the count from 5 and the order of taken and untaken
branches.

Cross-check: a separate Python simulation of the four-instruction machine gives
every contract value (8, 16, 40, 514, 4, 512), the practice count of 12 and the
lesson's 6 instructions from 2, and refuses the three invalid values; the
counts were also derived by hand from 2n + 2. `pnpm vitest run
labs/computer-architecture-execution/how-computers-execute-programs/` passes 18
tests, and `pnpm lab computer-architecture-execution/how-computers-execute-programs`
fails all 8 cases against the starter. `pnpm subject:report` counts 8 cases and
no longer raises P2 for the lesson; its remaining flags belong to later findings
(L9, L10) or the audit's C4 and L6 judgments.

Same command and environment as the previous entry: zero type errors, warnings
or hints; formatting and lint passed; 434 tests in 65 files, none skipped,
including the native drift check; 39 pages; 142 browser tests. No figure
changed, so no screenshots were taken.

## Binary representation: a hidden two's complement contract — 2026-11-25

Fixes finding F5 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard P2, P5). The attempt lab's contract grows from
four cases to seven: the existing 0, 128, 173 and 250, the top of the signed
range (127), and refusals that expect a `RangeError` for 256, −1 and 1.5. The
first practice card asked the learner to predict 173 and 250, two hidden cases,
and its reveal named the other two. It now states the contract, including the
refusal, names the kinds of hidden case, and asks for 156 and 100, which no
hidden case uses; the reveal explains those two and why values outside 0–255
are refused rather than wrapped. A new model test asserts both practice
answers, and the existing test still checks every byte against the
weighted-bit definition.

Cross-check: Python's `struct` module, packing each value as an unsigned byte
and unpacking it as a signed one, gives every contract value and both practice
answers and refuses 256, −1 and 1.5; each was also computed by hand as raw −
256 for patterns with the top bit set. `pnpm vitest run
labs/computer-architecture-execution/binary-and-data-representation/` passes
15 tests, and `pnpm lab computer-architecture-execution/binary-and-data-representation`
fails all 7 cases against the starter. `pnpm subject:report` raises no flag for
the lesson.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 438 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Architecture and performance: Amdahl bars from the model — 2026-11-25

Fixes finding F6 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard V2). `AmdahlBars` wrote 0.25, 0.75, 0.1875,
0.4375 and 2.286 as literals, and its segment widths as fixed percentages. A new
`amdahlTimes(serial, speedup)` in the performance lab returns the unchanged and
improvable parts of a normalized baseline time, the improved part, the new
total and `amdahl()`'s speedup. The figure keeps only the lesson's illustrative
inputs (a quarter serial, four times faster) and computes every number, label,
accessible name and segment width from it. The caption now reads "making 75% of
baseline time 4× faster" instead of "improving 75% of baseline time fourfold";
nothing else the learner sees changed. A new test asserts the five values for
0.25 and 4, that the total is the reciprocal of `amdahl()` for four other
inputs, and that invalid inputs are refused through `amdahl()`.

Cross-check: by hand, 0.75 ÷ 4 = 0.1875, 0.25 + 0.1875 = 0.4375 and
1 ÷ 0.4375 = 2.2857…, which the existing verified output already prints as
2.286x. `pnpm vitest run labs/computer-architecture-execution/architecture-and-performance/`
passes 29 tests, and `pnpm lab computer-architecture-execution/architecture-and-performance`
still fails all 9 cases. `pnpm subject:report` no longer raises V2 for the
lesson; its other flags are C4 (40 minutes, one mechanism) and L9, which F13
addresses.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 439 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.

Visual review: `pnpm shots` with a selector for the figure, at 1280 and 390 px
in light and dark themes, plus the page without JavaScript; report.json shows
no overflow or console errors. The bars match the old widths (25% and 75%, then
25% and 18.75%); at 390 px "0.1875" fits its segment as before.

## CPU, registers and instructions: instruction fields from the decoder — 2026-11-25

Fixes finding F6 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard V2). `InstructionFields` hard-coded the bits of
0x2311, the field widths, the meaning of each field and the ranges. The CPU lab
now exports the format's field layout, `FIELDS` (opcode 4 bits, register 4,
immediate 8, most significant first), and its assigned opcodes, `OPCODES`
(1 set, 2 add). The figure encodes the lesson's worked instruction with
`encode`, decodes it with `decode` and computes the bit slices, labels, ranges,
accessible name and column proportions from those exports. The learner sees the
same figure; "(two assigned here)" now reads "(2 assigned here)". A new test
checks, for all 8,192 valid words, that shifting and masking by `FIELDS`
recovers exactly what `decode` returns, that the widths fill 16 bits, and that
`decode` refuses every opcode `OPCODES` leaves unassigned.

Cross-check: by hand, 0x2311 is 0010 0011 00010001, which is opcode 2, register
3 and immediate 17, the values the existing verified output prints.
`pnpm vitest run labs/computer-architecture-execution/cpu-registers-and-instructions/`
passes 12 tests, and `pnpm lab computer-architecture-execution/cpu-registers-and-instructions`
still fails all 6 cases. `pnpm subject:report` no longer raises V2 for the
lesson; its other flags are C4 (35 minutes, one mechanism) and L9, which F13
addresses.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 440 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.

Visual review: `pnpm shots` with a selector for the figure, at 1280 and 390 px
in light and dark themes, plus the page without JavaScript; report.json shows
no overflow or console errors. The figure matches the previous layout,
including the 1 : 1 : 2 field columns and the wrapped field labels at 390 px.

## Cache organization: placement figure from the cache model — 2026-11-25

Fixes finding F6 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard V2). `CachePlacement` recomputed the block, tag,
set and offset of address 64 inline. It now checks each of its three
geometries with the cache lab's `checkGeometry`, takes the field widths from
`fieldBits` and the tag, set, offset and block from `splitAddress`, and its
caption and list label compute the address, its block and the address width
instead of typing them. The learner sees the same figure. A new test asserts
the widths and splits the figure draws for address 64 in the direct-mapped,
2-way and fully associative arrangements of four 16-byte lines (tags 1, 2 and
4; set 0; offset 0; block 4).

Cross-check: by hand, 64 = 0100 0000, so with four offset bits the block is 4;
4 mod 4, 4 mod 2 and 4 mod 1 put it in set 0 each time, and the remaining tag
bits read 1, 2 and 4. `pnpm vitest run labs/computer-architecture-execution/cache-organization/`
passes 21 tests, and `pnpm lab computer-architecture-execution/cache-organization`
still fails all 5 cases. `pnpm subject:report` no longer raises V2 for the
lesson; its other flags are C4 (40 minutes, one mechanism) and L10, which F8
addresses.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 441 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.

Visual review: `pnpm shots` with a selector for the figure, at 1280 and 390 px
in light and dark themes, plus the page without JavaScript; report.json shows
no overflow or console errors, and the figure matches its previous rendering.

For owner review: while reading this lesson, the audit's follow-up noticed that
the first practice card asks for two streams that are hidden contract cases (3
and 4), and that the replacement section works the first of them in the body.
That is outside F6 and is recorded for the final audit of this branch.

## Reading assembly: a verified interpreter output — 2026-11-25

Fixes finding F7 of the 2026-11-17 architecture audit with the enhance-lesson
skill (standard L9, E2). The x86-64 interpreter was the only tested model shown
without an output. A new `x86Example()` takes the four committed listings as
text, so the model still reads no files, runs them on {3, 5, 7, 9} and prints
what the tests already asserted: `sum_to` with four values executes 58
instructions at -O0 and 23 at -O2 and returns 24; with no values it returns 0
at both levels; `scale_sum` with factor 2 returns 48 at both. A new test reads
the listings and compares the output exactly. The lesson's model disclosure is
now titled "Inspect the tested model and expected output" and shows the
interpreter with that verified output; the -O0 listings and `main.c` moved to
their own disclosure, "Inspect the -O0 listings and the native program's
checks". The paragraph after them now begins "The tests check the output
above exactly", so the lesson also meets F13. The example leaves out the
`jne` count the stepper asks the learner to predict and practice 02's
`scale_sum` result for factor 3.

Cross-check: every printed value was already asserted by existing tests (58
and 23 instructions, 24, 0, 48), and a separate script ran the same listings
through the interpreter to confirm them before the test was written.
`pnpm vitest run labs/computer-architecture-execution/reading-assembly/`
passes 21 tests, and `pnpm lab computer-architecture-execution/reading-assembly`
still fails all 9 cases. `pnpm subject:report` now counts one verified output
asserted by a test and raises only C4 (35 minutes, one mechanism).

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check, which also confirmed the four
listings unchanged; 39 pages; 142 browser tests, including the per-lesson check
that opens the model disclosure by keyboard. No figure changed, so no
screenshots were taken.

## Program execution: what the tests check — 2026-11-25

Fixes finding F13 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L9). The datapath model's disclosure is now
followed by a paragraph that says what `datapath.test.ts` asserts: the output
exactly, which state each instruction changes, the shared fetch and decode
path, data memory used only by the load and the store in their own directions,
32-bit wraparound, and the three refusals (an address holding no data, a fifth
register, a negative address). The sentence avoids naming which instruction
changes memory, since the stepper above asks the learner to predict that. The
accumulator model's existing sentence about its tests now starts its own
paragraph. `pnpm subject:report` no longer raises L9 for the lesson; its L6 flag
is the "predict both the new accumulator…" prompt, which is followed by the
program's instruction table, not by its trace (the trace is in the "Check after
predicting" disclosure), so it is not a reveal.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## CPU, registers and instructions: what the tests check — 2026-11-25

Fixes finding F13 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L9). The paragraph after the decoder model began
"The tests round-trip"; it now begins "The tests check the output above
exactly", keeps the round trip of all 8,192 valid instructions, and adds the
layout test from the F6 change (the figure's fields recover exactly what
`decode` returns) beside the refusals of out-of-range fields and reserved
opcodes. `pnpm subject:report` no longer raises L9 for the lesson; C4 remains
(35 minutes, one mechanism).

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Compilation and execution: what the tests check — 2026-11-25

Fixes finding F13 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L9). After the teaching linker's disclosure, a
paragraph now says what `example.test.ts` asserts: the output exactly, a
backward reference, an empty image and a symbol at address 0, and the refusal
of undefined and duplicate symbols, invalid offsets, words and load bases, and
overlapping patches without changing the inputs. The relocation test of the
real call was already described in the body. `pnpm subject:report` no longer
raises L9 for the lesson; C4 remains (40 minutes, one mechanism).

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Stack and heap: what the tests check — 2026-11-25

Fixes finding F13 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L9). After the lifetime model's disclosure, a
paragraph now says what `example.test.ts` asserts (the output exactly, reverse
call order without releasing what a call allocated, the exact stack limit and
an overflowing call that changes nothing, release in any order but not twice,
and the refusal of invalid sizes and of totals beyond the safe integer range)
and that `trace.test.ts` and `frames.test.ts` check the stepper's story and the
figure's real -O0 frames. It names no number that practice 02 asks the learner
to predict. `pnpm subject:report` no longer raises L9 for the lesson; C4, L3
and L10 belong to F2, F9 and F8.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Memory hierarchy: what the tests check — 2026-11-25

Fixes finding F13 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L9). After the cache model's disclosure, a
paragraph now says what the lab's tests assert: the output exactly, the block,
slot and result of every access in a trace that crosses a line boundary and
conflicts in one slot, cold and empty traces, the average at the all-hit and
all-miss extremes, the refusal of invalid geometry, addresses, times and miss
rates, and, in `traversal.test.ts`, the lines the traversal figure marks.
`pnpm subject:report` no longer raises L9 for the lesson; C4, L3 and L10 belong
to F2, F9 and F8, and L6 is the audit's known false signal.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Hardware-software interaction: what the tests check — 2026-11-26

Fixes finding F13 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L9). After the privilege model's disclosure, a
paragraph now says what `example.test.ts` asserts: the output exactly, that a
fault or an interrupt saves the current instruction index without changing its
input state, that instruction zero survives entry and return, and that nested
entry, a return with no saved location and invalid or unrepresentable indexes
are refused. The model follows the predict prompt's "Check after predicting"
disclosure, so naming the saved indexes reveals nothing new. `pnpm
subject:report` no longer raises L9 for the lesson; C4 remains (40 minutes, one
mechanism).

The worker restarted between this entry and the previous one; the `/tmp`
toolchains survived, and the gate ran with the same command and environment as
the first entry of 2026-11-25: zero type errors, warnings or hints; formatting
and lint passed; 442 tests in 65 files, none skipped, including the native
drift check; 39 pages; 142 browser tests. No figure changed, so no screenshots
were taken.

## I/O mechanisms: what the tests check — 2026-11-26

Fixes finding F13 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L9). After the buffer model's disclosure, a
paragraph now says what `example.test.ts` asserts: the output exactly, every
allowed transition and a set of refused ones, completion sizes at and beyond
the buffer's limits, malformed byte counts, and that no transition changes an
earlier state, plus the separate tests of the polling timeline. It is worded so
that it does not answer practice 01, which asks the learner to predict which
completion sizes are accepted. `pnpm subject:report` no longer raises L9 for
the lesson; C4 (55 minutes) is F2's split.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Architecture and performance: what the tests check — 2026-11-26

Fixes finding F13 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L9). The paragraph after the model began "The
lab tests these calculations and invalid inputs"; it now begins "The tests
check this output exactly" and names what `example.test.ts` asserts: CPU time
scaling with work and inversely with frequency, Amdahl's serial and parallel
limits, the parts the Amdahl bars draw (added by the F6 change), and the
refusal of invalid counts, CPIs, frequencies, fractions and overflowing
estimates. "Both arithmetic helpers" became "Each arithmetic helper", since the
F6 change added a third. The serial-limit values that practice 02 asks for are
not named. `pnpm subject:report` no longer raises L9; C4 remains (40 minutes,
one mechanism).

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken. With this entry F13 is done
for all nine lessons it named (reading assembly met it in the F7 change).

## Program execution: a numbered Practice section — 2026-11-26

Fixes finding F8 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L10). The heading "Attempt the control-flow
contract" is now "Practice", and the attempt card is titled "01 / Count executed
instructions" instead of "Independent execution attempt"; its text and command
are unchanged. `pnpm subject:report` no longer raises L10 for the lesson.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Memory hierarchy: a numbered Practice section — 2026-11-26

Fixes finding F8 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L10). The heading "Predict unfamiliar accesses"
is now "Practice", and the attempt card is titled "01 / Trace a direct-mapped
cache" instead of "Independent cache attempt"; its text and command are
unchanged. `pnpm subject:report` no longer raises L10 for the lesson.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Cache organization: a numbered Practice section — 2026-11-26

Fixes finding F8 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L10). The three practice cards sat at the end of
"Layout decides which sets you use", after its prose. They now follow a
"Practice" heading, and the first card is titled "01 / Simulate an LRU cache"
instead of "Independent cache attempt", so the cards run 01, 02, 03; their
text and commands are unchanged. `pnpm subject:report` no longer raises L10
for the lesson; C4 remains (40 minutes, one mechanism).

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Stack and heap: a Practice section — 2026-11-26

Fixes finding F8 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L10). The two numbered practice cards sat inside
"Test lifetimes without inspecting the runtime", after the model disclosures.
They now follow their own "Practice" heading; the model stays in its section,
and the cards' titles, text and commands are unchanged. `pnpm subject:report`
no longer raises L10 for the lesson; C4 and L3 belong to F2 and F9.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Memory hierarchy: the analogy's limit in the standard form — 2026-11-26

Fixes finding F9 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L3). The hook's limit read "It stops being exact
because hardware transfers fixed blocks…"; it now reads "The analogy stops at
choice: hardware moves fixed-size lines rather than chosen items, places each
line by fixed rules and can overlap requests, and a cache does not know which
application values you consider useful". The claims are the ones the sentence
already made. `pnpm subject:report` no longer raises L3 for the lesson.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Stack and heap: the analogy's limit in the standard form — 2026-11-26

Fixes finding F9 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L3). The hook's limit read "These analogies
explain lifetime order, but they do not specify…"; it now reads "The analogy
stops at placement: it explains the order in which lifetimes end, not physical
addresses, allocation algorithms or where a language places its objects". The
claims are unchanged. `pnpm subject:report` no longer raises L3 for the lesson;
C4 (50 minutes) is F2's split.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Multicore coherence and atomics: the analogy in the hook — 2026-11-26

Fixes finding F9 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L3). The first section had no concrete scenario,
and the document-editing analogy with its limit sat in the coherence section.
The hook now opens with two threads that each increment only their own counter
yet run at different speeds depending on how far apart the counters are, asks
why, and follows with the analogy and "The analogy stops at granularity", moved
unchanged from the coherence section. The hook names no ratio; the false-sharing
section answers it from the recording, and `models.test.ts` asserts the
recorded adjacent layout is more than three times slower than the padded one.
`pnpm subject:report` no longer raises L3 for the lesson; C4 (35 minutes) and
the documented P1 folder exception remain.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## DRAM, SSDs and disks: an analogy of its own — 2026-11-26

Fixes finding F9 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L3: analogies are not reused). The hook's book
fetched from a desk, a shelf, a library basement or another city repeated the
memory hierarchy lesson's desk, shelf and warehouse. It now answers a question
at work: from what you know, your notes, a colleague on the phone or an archive.
Each is a different mechanism rather than a longer walk, and follow-up questions
are quick once the colleague is on the line, which mirrors the lesson's open DRAM
row and sequential disk reads. The limit is unchanged: "The analogy stops at
overlap". A search of the subject's lessons finds no other use of this
analogy. `pnpm subject:report` raises only C4 (35 minutes, one mechanism).

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Program execution: the pipeline link points at its lesson — 2026-11-26

Fixes finding F10 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L13, W9). "The performance lesson works the
latency, throughput and dependency timeline" was stale: that timeline moved to
`pipelining-and-hazards` when the processor chapter was split. The sentence now
links the pipelining lesson, whose "Five stages, overlapped" section defines
throughput against per-instruction latency and whose hazard sections step the
dependency timeline.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages, with every internal
link validated; 142 browser tests. No figure changed, so no screenshots were
taken.

## Compilation and execution: what `bump` connects to — 2026-11-26

Fixes finding F10 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L13, W9). "The same `bump` function connects this
build to the CPU and stack lessons" was stale: the stack lesson uses
`scale_sum` and `sum_to`, not `bump`. The sentence now links the registers
lesson, which imports `bump-O2.txt` and reads its listing, and says that
`scale_sum` and `sum_to` connect the build to the assembly lesson, which reads
their listings.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages, with every internal
link validated; 142 browser tests. No figure changed, so no screenshots were
taken.

## Multicore coherence and atomics: links to what it builds on — 2026-11-26

Fixes finding F10 of the 2026-11-17 architecture audit for this lesson with the
enhance-lesson skill (standard L13). The lesson had no `/learn` links. The
first section now links its prerequisite cache organization lesson ("followed
lines through one core's cache"), the compiled listings link its other
prerequisite, the assembly lesson, and the closing note on locks, condition
variables and deadlock links the operating systems subject. Because that
subject has no lessons yet, the note now says it "plans lessons on them"
(its path section lists "Concurrency and synchronization" and "Race
conditions, deadlocks, and resource contention") instead of "covers them".

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages, with every internal
link validated; 142 browser tests. No figure changed, so no screenshots were
taken.

## Measuring performance: the lab's README — 2026-11-26

Fixes finding F11 of the 2026-11-17 architecture audit for this lab with the
enhance-lesson skill (standard P1, P6). `labs/computer-architecture-execution/measuring-performance/`
had no README. The new "Independent practice" README states the contract
(median and nearest-rank p90 without changing the input, and a `RangeError`
for an empty list or a non-finite value), one worked case that no hidden case
uses (`[4, 2, 8]` gives median 4 and p90 8), the run command, and what to
explain before opening the reference. It records the provenance of `timing.c`
and `timing.json` (flags `-std=c17 -O2`, checked sums, the fields the native
runner records, `--record-measurements`) and that `perf-counters.sh` is
owner-run, with its tested exit status 2 when `perf` is missing. Each of these
was checked against `verify-native.mjs`, `timing.json` and `stats.test.ts`.
`pnpm subject:report` no longer raises P1 for the lesson; its V2 flag is the
audit's known false signal (`MeasureWorkflow` is a concept figure with nothing
to compute).

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Binary representation: the lab README states its contract — 2026-11-26

Fixes finding F11 of the 2026-11-17 architecture audit for this lab with the
enhance-lesson skill (standard P6). The README was generic. It now states the
contract (read a pattern 0–255 as two's complement, refuse anything else with a
`RangeError`), one worked case that is the lesson's own (255 reads as −1) and
no hidden case, the run command, and what to explain before opening the
reference.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.

## Program execution: the lab README states its contract — 2026-11-26

Fixes finding F11 of the 2026-11-17 architecture audit for this lab with the
enhance-lesson skill (standard P6). The README was generic. It now states the
contract (count every executed instruction of set/add 255/branch/halt, refuse a
value that is not an unsigned byte with a `RangeError`), one worked case that is
the lesson's own trace (six instructions from 2), the run command, the state
invariant to explain, and what `datapath.ts` is for.

Same command and environment as the first entry of 2026-11-25: zero type
errors, warnings or hints; formatting and lint passed; 442 tests in 65 files,
none skipped, including the native drift check; 39 pages; 142 browser tests.
No figure changed, so no screenshots were taken.
