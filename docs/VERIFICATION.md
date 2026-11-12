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
