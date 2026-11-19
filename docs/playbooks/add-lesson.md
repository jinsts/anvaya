# Add a lesson

Use this to draft a planned topic or a lesson the owner requested, or to
rewrite one substantially. The bar is [SUBJECT_STANDARD.md](../SUBJECT_STANDARD.md);
IDs below such as L6 refer to it. Field and component details are in
[AUTHORING_GUIDE.md](../AUTHORING_GUIDE.md). Claude agents can run this with
the `draft-lesson` skill (`.claude/skills/draft-lesson/`).

Reference lessons: `computer-architecture-execution/measuring-performance`
(recorded measurements, owner-run tools), `cache-organization` (figure and
widget from one tested model), `floating-point-representation` (several
figures computed from a model) and `pipelining-and-hazards` (stepper with a
static equivalent). `dsa/arrays` predates the standard.

## Before you start

- Confirm the topic is planned in a path on the main branch, or requested by
  the owner (W2). A topic that holds several mechanisms is split into several
  planned pages first, as a planning change ([ADR 0008](../adr/0008-subject-chapters-and-lesson-pages.md)).
- Read the prerequisite lessons, the next lesson and the subject's running
  threads (C6). Reuse their terms, programs, tags and cross-links, and decide
  which concepts this page owns and which it links to (C5).
- Pick sources from `src/content/sources/` and open the exact pages you will
  cite. Register new sources first ([add-source.md](add-source.md)).
- Write a one-paragraph plan in your scratch notes: the mechanism, the 2–4
  objectives, the worked example, each figure and what computes it, the lab
  contract, and any native evidence. Estimate 15–30 minutes;
  31–45 only if it is still one mechanism.

## Steps

1. **Scaffold** the lesson and its lab:

   ```sh
   pnpm new:lesson <subject>/<slug> --title "Concept: hook" --path <path-id>
   ```

   Move the topic from the section's `planned` list to its `lessons` list. The
   build fails until the lesson's default `path` lists it.

2. **Build the lab first** (W4, P1–P6) in `labs/<subject>/<slug>/`:
   - The reference model (`example.ts` or a domain name such as `pipeline.ts`)
     with its assumptions in a header comment, and tests for every transition,
     boundary and refusal, plus an `*Example()` function whose exact output the
     lesson displays (E2).
   - `contracts.ts` with at least five `unseen case N` cases; refusals expect a
     specific error type or message.
   - `practice.test.ts` adapting the model to the contract, so the gate
     cross-checks it.
   - An independent check of the expected values: a second implementation (for
     example in Python), a real tool, or working by hand. Note how in the record.
   - `pnpm lab <subject>/<slug>` must fail every case against the starter.
   - The README titled "Independent practice".

3. **Record native evidence** where the subject has a toolchain (E3–E6): add
   programs, listings or measurements to the subject's native runner, record
   them with provenance, and test only the relationships the prose will state.
   Tools you cannot run get an owner-run script with a tested refusal path.

4. **Build the figures** from the model or the recorded files (V1–V8,
   [add-interactive.md](add-interactive.md)). Components import from `labs/`.
   No figure or caption may answer a practice task (L6). Label invented
   parameters as illustrative (V7).

5. **Write the lesson** in this order, leaving out nothing the standard
   requires:
   1. A hook: a concrete scenario, an analogy and "The analogy stops at X: …"
      (L3), then a link to the lesson it builds on.
   2. Mechanism sections, each anchored by a figure (L4).
   3. At least one predict prompt with its answer in a "Check after …"
      disclosure (L5, L6).
   4. A worked example from the model, the model's boundary and a pitfall or
      diagnosis (L7, L8).
   5. The tested model disclosure and a "The tests check …" paragraph (L9).
   6. `## Practice`: `01 /` is the `pnpm lab` attempt; further cards extend the
      lab or are paper tasks, each followed by a "Check after …" disclosure
      (L10).
   7. `## Check your reasoning` with one three-option `ConceptCheck` (L11).
   8. `## Two-minute recap` with 3–6 takeaways (L12).

   Complete the frontmatter: concrete `summary`, `difficulty`,
   `estimatedMinutes`, 2–4 demonstrable `learningObjectives`, `prerequisites`,
   existing `tags` and `skills`, 3–6 `interviewQuestions`, and specific
   `sources` (L1, L2). The layout renders objectives, prerequisites, interview
   practice, sources and navigation; do not repeat them in the body.

6. **Link problems** only where one genuinely applies the lesson's idea (P7,
   [add-problem.md](add-problem.md)). None is better than a weak one.

7. **Keep neighbours consistent** (W9): update cross-links in lessons that
   handed material over, the subject overview, path YAML comments and any
   hard-coded test lists.

8. **Verify, record and commit** with [verify-change.md](verify-change.md):
   `pnpm subject:report <subject>/<slug>`, the full gate, `pnpm shots` review,
   a `docs/VERIFICATION.md` entry and one commit for this lesson.

## Writing

- Short paragraphs, concrete examples and plain words. Define a term before
  using it.
- Separate the conceptual model from language, runtime or toolchain behavior.
- Name the assumptions behind every complexity or cost claim.
- Never state results you did not run (E7). Set `verified` on `CodeExample`
  only when a test asserts that exact output.
- State hypotheses as hypotheses and list them for owner review (E9).

## Interview questions

3–6 questions an interviewer would plausibly ask, testing reasoning rather than
trivia. Each `answer` is 3–5 sentences that state assumptions and trade-offs,
written to be rehearsed aloud, and agrees with the lesson and its sources.
`followUps` hold deeper questions an interviewer might ask next. Only
`` `code` `` and `**bold**` are allowed inside these strings.

## Done when

- [ ] `pnpm verify` passed with the toolchain environment, or each failing or
      skipped check is reported with its output.
- [ ] `pnpm lab <subject>/<slug>` fails every case before an attempt.
- [ ] `pnpm subject:report <subject>/<slug>` shows no unexplained flag.
- [ ] Every figure was reviewed in `pnpm shots` captures at 390 and 1280 px in
      both themes, and widget states were checked with the keyboard.
- [ ] No `TODO` remains; every source is registered and was opened; status is
      `draft` with `drafter: agent`.
- [ ] A `docs/VERIFICATION.md` entry and one commit; the summary separates what
      was verified from what needs the owner's review.
