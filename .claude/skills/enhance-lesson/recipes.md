# Enhancement recipes

Each recipe lists what must change together. IDs are from
[docs/SUBJECT_STANDARD.md](../../../docs/SUBJECT_STANDARD.md). After any recipe:
update `estimatedMinutes` if reading or attempting time changed, check that the
recap and the concept check still match the lesson (L11, L12), and that the
lesson does not now teach something another lesson owns (C5).

## Add a point or clarification

1. Find the section where the learner needs it. Define new terms before use.
2. If it states a fact about the model, add or extend a test that asserts it
   (E9). If it states a fact from a source, cite the page you opened (E8).
3. If it answers a prompt or a practice task, put it in the "Check after …"
   disclosure, not in plain text (L6).
4. Add a recap bullet only if the point is a takeaway, and keep 3–6 (L12).

## Add a diagram or widget

1. Extend the lab model if the figure needs values it cannot compute yet, and
   test the new function.
2. Build the component in `src/components/diagrams/` (static) or
   `src/components/interactive/` (island), importing the model or recorded
   files from `labs/` ([add-interactive.md](../../../docs/playbooks/add-interactive.md)).
3. Wrap it in `DiagramFrame` with a caption that does not answer any practice
   task. Give a widget a static equivalent in the lesson.
4. Replace the prose or table the figure now carries; rewrite sentences that
   introduced what was removed (V8).
5. For a widget: a component test in `tests/unit/` and a keyboard test in the
   subject's e2e spec.
6. Review it with `pnpm shots`, including widget states, at 390 and 1280 px in
   both themes.

## Add a worked example

1. Compute it with the model: add a case to the model's tests or to its
   `*Example()` output. If the displayed output changes, change the lesson's
   `output` literal and the test together (E2).
2. Check it does not reveal a hidden contract case or an existing practice
   answer (P5). If it does, change the practice task instead.
3. Place it after the mechanism it illustrates, with its assumptions stated.

## Add a lab case

1. Add `it('unseen case N', …)` at the end of `contracts.ts`, numbered after the
   last case. Refusals expect a specific error type or message (P2).
2. Check the expected value independently (by hand, a second implementation or
   a real tool) and note how in the record (P4).
3. `pnpm vitest run labs/<subject>/<lab>/` must pass (the reference meets the
   new case). `pnpm lab <subject>/<lesson>` must still fail every case.
4. Update the README or the LabCard if the contract's scope changed; do not
   reveal the new expected value.

## Add or change a practice task

1. Number it after the last LabCard, keeping `01 /` onward without gaps (L10).
2. Give it a command only if that command tests it; otherwise it is a paper
   task with no test command.
3. Put the answer in a "Check after …" disclosure, and check it against the
   model or a test.

## Add a problem

Follow [add-problem.md](../../../docs/playbooks/add-problem.md): the problem must
apply this lesson's idea (P7). Check its title, difficulty and paid-only status
with the bank and its list memberships in the published list data. Write
original hints, and update the counts and mock list in
`tests/e2e/practice.spec.ts`.

## Add an interview question

Keep 3–6 (L2). The answer is 3–5 sentences, states its assumptions and agrees
with the lesson; add `followUps` where an interviewer would push. The prompt
must be unique within the lesson.

## Add a source

Open the page; it must support the claim it is attached to. If its site is not
registered, register it first ([add-source.md](../../../docs/playbooks/add-source.md)).
Cite the specific page with a descriptive label.

## Bring a legacy lesson up to the standard

Work through `pnpm subject:report <subject>/<slug>` flags in this order: lab
(P1–P6) → tested model disclosure and verified outputs (L9, E2) → figures from
the model (V1, V2) → anatomy (L3–L12). When it passes, remove the lesson from
the `legacy` set in `tests/e2e/lessons.spec.ts` and from "Known exceptions" in
the standard. Use one change per lesson; it may take several commits if the
owner wants checkpoints.
