# Verify and record a change

Every content or platform change ends here, before its commit
([standard](../SUBJECT_STANDARD.md) W5–W8). Report only checks you actually
ran; if one could not run, say which and why.

## 1. Set up the environment once

| Need                                 | Setup (no root; Ubuntu packages extracted into a folder)      | Variable                                                                  |
| ------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Chromium libraries                   | `sh scripts/setup-browser-deps.sh /tmp/anvaya-browser-deps`   | `LD_LIBRARY_PATH=/tmp/anvaya-browser-deps/usr/lib/x86_64-linux-gnu`       |
| GCC 15.2 and binutils 2.46           | `sh scripts/setup-gcc-ubuntu.sh /tmp/anvaya-cc`               | `ANVAYA_CC=/tmp/anvaya-cc/compiler`, `ANVAYA_BINUTILS=/tmp/anvaya-cc/bin` |
| GCC 15.2 for aarch64 (listings only) | `sh scripts/setup-gcc-arm64-ubuntu.sh /tmp/anvaya-cc-arm64`   | `ANVAYA_CC_ARM64=/tmp/anvaya-cc-arm64/compiler`                           |
| strace 6.19                          | `sh scripts/setup-strace-ubuntu.sh /tmp/anvaya-strace`        | `ANVAYA_STRACE=/tmp/anvaya-strace/strace`                                 |
| OpenJDK 21                           | `sh scripts/setup-jdk-ubuntu.sh /tmp/anvaya-jdk`              | `ANVAYA_JAVA_HOME=/tmp/anvaya-jdk/root/usr/lib/jvm/java-21-openjdk-amd64` |
| Go 1.26                              | `sh scripts/setup-go-ubuntu.sh /tmp/anvaya-go`                | `ANVAYA_GO=/tmp/anvaya-go/root/usr/lib/go-1.26/bin/go`                    |
| Docker, with a daemon that answers   | Docker Engine or Docker Desktop (containers run unprivileged) | `ANVAYA_DOCKER=docker`                                                    |
| An isolated preview port             | Any free port, so a stale preview is never tested             | `PLAYWRIGHT_PORT=4371`                                                    |

The recorded toolchains come from Ubuntu 26.04 packages. On another Ubuntu
release, prefix a setup command with `ANVAYA_UBUNTU_SUITE=resolute` to
download them through a private package list in the folder
(`scripts/ubuntu-packages.sh`). The JDK is the exception: Ubuntu 26.04's
build needs glibc 2.42, so use the machine's own suite (for example `noble`),
which has the same 21.0.13.1. The subjects' native lab READMEs say which
artifacts need which tool.

Folders under `/tmp` disappear on reboot. Check first: `ls /tmp/anvaya-*`, and
`ldd` on Playwright's `chrome-headless-shell` for `not found` libraries. The
shared native runner (`scripts/native.ts`) reports a tool whose variable is
unset, or that does not run, as absent, and skips everything that needs it
with the reason; the record must name what was skipped.

## 2. Run the gate

```sh
PLAYWRIGHT_PORT=4371 \
  LD_LIBRARY_PATH=/tmp/anvaya-browser-deps/usr/lib/x86_64-linux-gnu \
  ANVAYA_CC=/tmp/anvaya-cc/compiler ANVAYA_BINUTILS=/tmp/anvaya-cc/bin \
  ANVAYA_CC_ARM64=/tmp/anvaya-cc-arm64/compiler \
  ANVAYA_STRACE=/tmp/anvaya-strace/strace \
  ANVAYA_JAVA_HOME=/tmp/anvaya-jdk/root/usr/lib/jvm/java-21-openjdk-amd64 \
  ANVAYA_GO=/tmp/anvaya-go/root/usr/lib/go-1.26/bin/go ANVAYA_DOCKER=docker \
  pnpm verify
```

It runs type checks, formatting, lint (tokens and placeholders), unit and lab
tests (including each subject's native drift check for the tools that are
set), the static build with search index and link validation, and the browser
tests. Use `pnpm lint` and `pnpm vitest run <path>` while iterating, but
commit only after a full run.

For a lesson, also run:

- `pnpm lab <subject>/<lesson>`: it must fail every case before an attempt.
- `pnpm subject:report <subject>/<lesson>`: resolve each flag or justify it in
  the record.
- The subject's native registry on its own when its artifacts changed (for
  example `node labs/operating-systems-runtime-internals/native/registry.ts`),
  and `--record` or `--record-measurements` only when you intend to change
  them.

## 3. Review screenshots

```sh
pnpm build
pnpm shots <subject>/<lesson>              # every figure and widget
pnpm shots <subject>/<lesson> --select ".my-widget"   # a specific state or element
```

Open every image in `screenshots/<subject>--<lesson>/`. Each figure is
captured at 1280 and 390 px in light and dark themes, and the page at 390 px
without JavaScript. `report.json` catches overflow and console errors, not
clipped labels, colliding text or unreadable contrast, so look. `--select`
captures chosen elements in their first state; for a widget's later states
(after stepping, revealed answers), drive it with a short Playwright script in
your scratch folder and capture the same widths and themes. Never commit
screenshots or accept visual baselines without the owner.

Recurring problems from the architecture work, worth checking every time:

- Labels that collide or clip at 390 px; axes and legends that need to move
  into a key.
- Tables wider than the column: wrap them in
  `<div className="table-scroll" tabIndex={0} role="region" aria-label="…">`.
- Prose styles leaking into figures (list indentation, inline-code borders,
  `pre` indentation), and words broken mid-word.
- Spaces eaten between inline elements: add `{' '}`.
- In MDX, a wrapped line that starts with `1.` becomes a list.
- A sentence that introduced a figure or table you removed ("…:" with nothing
  after it).

## 4. Update what the change touches

- Hard-coded test lists: problem counts and the mock-interview list in
  `tests/e2e/practice.spec.ts`, and the chapter list in
  `tests/e2e/catalog.spec.ts`. Per-lesson checks need no list
  (`tests/e2e/lessons.spec.ts`).
- A new widget needs a keyboard test in the subject's e2e spec and a component
  test in `tests/unit/` ([add-interactive.md](add-interactive.md)).
- Cross-links, the subject overview and path YAML comments when material moves.

## 5. Record it in `docs/VERIFICATION.md`

Append one entry per change: `## <Change> — YYYY-MM-DD`, then short paragraphs
in this order, leaving out any that do not apply:

1. **Scope:** what was drafted or changed, and which material moved in or out.
2. **Evidence:** programs run, method (alternated runs, checksums, idle or
   not), where the recorded files live, what the tests assert about them.
3. **Models and tests:** what the tests check, the independent cross-check
   (second implementation, real tool, by hand) and that `pnpm lab` fails before
   an attempt.
4. **Sources and problems:** pages opened before citing; how problem titles,
   difficulty and list memberships were checked.
5. **Command and results:** the command (or "Same command as the previous
   entry") and measured counts: type errors, tests and files, pages, browser
   tests, native artifacts.
6. **First-run failures** and how each was fixed.
7. **Visual review:** what was captured, at which widths and themes, and what
   review changed.
8. **Limits and owner review:** environment limits, hypotheses, unverified
   claims, judgment calls.

## 6. Commit

One logical change per commit, and one lesson per commit. Use Conventional
Commits: `type(scope): imperative phrase` with types `feat`, `fix`, `refactor`,
`test`, `docs`, `build`, `chore` and scopes such as `content`, `labs`,
`diagrams`, `sources`, `practice`, `scripts`. The body says what the learner
sees and where its values come from. Never push, deploy or open a pull request
without the owner's approval. Your summary separates what you verified from
what needs the owner's review.
