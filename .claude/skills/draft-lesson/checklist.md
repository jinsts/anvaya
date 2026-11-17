# Pre-commit self-review

Run the commands, then answer each line with evidence (file:line, a test name
or a screenshot). IDs are from
[docs/SUBJECT_STANDARD.md](../../../docs/SUBJECT_STANDARD.md). An unchecked line
is either fixed or reported to the owner with a reason.

## Commands

- [ ] `pnpm subject:report <subject>/<slug>`: no flag left unexplained.
- [ ] `pnpm lab <subject>/<slug>`: every case fails before an attempt (P3).
- [ ] `pnpm vitest run labs/<subject>/<slug>/`: the reference passes (P4).
- [ ] The full gate with the toolchain environment, and native runs if
      artifacts changed (W5, E3).
- [ ] `pnpm shots <subject>/<slug>`, plus captures of widget states; every
      image opened (V3).

## Mistakes the architecture review caught

- [ ] No answer sits in plain text right after a prompt, in a figure, a
      caption, a no-JavaScript fallback table, or the hook (L6).
- [ ] No practice task repeats a case the lesson already worked (L6, P5).
- [ ] LabCards are numbered `01 /` onward without gaps, and card 01 is
      `pnpm lab` (L10).
- [ ] Every number in a figure comes from the model or a recording; nothing is
      hand-typed (V2). Invented parameters say "illustrative" (V7).
- [ ] Each verified output matches its test literally (E2).
- [ ] Contract refusals expect a specific error (P2).
- [ ] Each concept is taught here or linked, not taught twice (C5), and links to
      other lessons describe what those lessons now teach (L13).
- [ ] The hook's analogy is not one another lesson already uses (L3).
- [ ] Measured claims state their environment limits and claim no more than the
      data shows (E5, E9).
- [ ] Every cited page was opened and supports its claim (E8).
- [ ] `estimatedMinutes` is honest for reading plus attempting, within 15–30 (C4).
- [ ] Removed figures left no dangling introduction; replaced components were
      deleted (V8).
