# Add a lesson

Use this for a new concept lesson or a substantial revision. Field and
component details are in [AUTHORING_GUIDE.md](../AUTHORING_GUIDE.md).
`src/content/lessons/dsa/arrays.mdx` is the reference lesson.

## Before you start

- Confirm the topic is listed under `planned` in a path in
  `src/content/paths/` on the main branch, or that the owner asked for it.
- Read the prerequisite lessons and the closest existing lesson. Reuse their
  terms, tags and cross-links.
- Find sources in `src/content/sources/`. Register new ones first
  ([add-source.md](add-source.md)).
- Size the page as one teaching unit: one mechanism, its worked example and its
  practice, usually 15–30 minutes. If a planned topic holds several mechanisms,
  propose splitting it into several planned pages before drafting
  ([ADR 0008](../adr/0008-subject-chapters-and-lesson-pages.md)).

## Steps

1. Scaffold the lesson, and a lab if it has an exercise:

   ```sh
   pnpm new:lesson dsa/two-pointers --title "Two pointers: Walk from both ends" --path dsa-foundations --lab
   ```

2. In the path YAML, move the topic from the section's `planned` list to its
   `lessons` list. The build fails until a lesson's default `path` contains it.
3. Complete the frontmatter: a concrete `summary`, `difficulty`,
   `estimatedMinutes`, 2–4 testable `learningObjectives`, `prerequisites`
   (lesson IDs), existing kebab-case `tags`, `interviewQuestions` and `sources`
   (specific pages within registered sources).
4. Write the body using the anatomy below. Replace every `TODO`.
5. Put runnable code in `labs/<subject>/<slug>/` with tests. Show it with
   `<CodeExample code={source} verified output="…" />`, importing the file with
   `?raw` so the page and the tests share one source.
6. Link 3–6 practice problems that use the idea ([add-problem.md](add-problem.md)).
7. Run `pnpm lint && pnpm test && pnpm build`. Open the page with `pnpm dev` at
   desktop and mobile widths in both themes, and use any widget with the keyboard.

## Lesson anatomy

Order sections by need and leave out any that do not help this concept.

1. **Why it matters:** a small concrete example and an analogy, including
   where the analogy stops.
2. **Mechanism:** step by step. Add a diagram or widget only when it shows the
   mechanism ([add-interactive.md](add-interactive.md)).
3. **Formal model:** definitions, invariants and assumptions.
4. **Implementation:** tested code and its expected output.
5. **Costs and trade-offs:** complexity with its conditions, using
   `<ComplexityTable>` for several operations.
6. **Use cases, alternatives and pitfalls.**
7. **Practice:** `<LabCard>` exercises, with hints in `<details>` placed after
   the attempt.
8. **`## Check your reasoning`:** a `<ConceptCheck>` that explains why every
   option is right or wrong.
9. **`## Two-minute recap`:** required. Three to six takeaways a returning
   learner can scan.

The layout adds the objectives, prerequisites, interview practice (from the
frontmatter and linked problems), sources and previous/next links. Do not
repeat them in the body.

## Interview questions

Add 3–6 `interviewQuestions` an interviewer would plausibly ask:

- `prompt`: a question that tests reasoning, not recall of trivia.
- `answer`: 3–5 sentences that state assumptions and trade-offs, written so a
  learner can rehearse it aloud. It must agree with the lesson and its sources.
- `followUps`: optional deeper questions an interviewer might ask next.

Use only `` `code` `` and `**bold**` inside these strings.

## Writing

- Short paragraphs, concrete examples and plain words. Define a term before
  using it.
- Separate the conceptual model from language or runtime behavior.
- Name the assumptions behind every complexity claim.
- Never state results you did not run. Set `verified` on `CodeExample` only
  when a test checks that output.
- Mark uncertain claims for the owner's review in your change description
  instead of presenting them as fact.

## Done when

- [ ] `pnpm verify` passes, or you report each failing check with its output.
- [ ] No `TODO` remains, all sources are registered, and the status is
      `draft` with `drafter: agent`.
- [ ] The page reads well at desktop and mobile widths in both themes, and any
      widget works with the keyboard.
- [ ] Your summary lists what you verified and what needs owner review.
