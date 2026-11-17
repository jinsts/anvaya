# Build a diagram or interactive widget

Add interaction only when it shows a mechanism better than prose and a static
figure. Every widget must still make sense without JavaScript. The visual
properties are V1–V8 in the [standard](../SUBJECT_STANDARD.md).

## Choose the smallest tool

| Need                                       | Use                                                            | Example                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Static figure                              | `<DiagramFrame caption>` with inline SVG in an Astro component | —                                                                                          |
| Select parts of a figure                   | Astro component with SVG and a small `<script>`                | `src/components/diagrams/IndexedMemory.astro`                                              |
| Coupled state, step-by-step traces, inputs | React island that imports the lesson's tested lab model        | `CacheExplorer.tsx` + `labs/computer-architecture-execution/cache-organization/example.ts` |

Keep large SVG in a component, not in MDX. Import lesson-specific components in
the lesson file; hydrated islands need `client:visible`.

## Requirements

- Put the mechanism in the lesson's pure, deterministic lab model and
  unit-test every state transition, boundary and invalid input there. Figures
  and widgets import it from `labs/` (or read the lab's recorded JSON and text
  artifacts at build time), so the figure, the tests and the prose cannot
  disagree. Never hand-type values a model can compute.
- Label invented machines, parameters and timings as illustrative.
- Never print an answer to a practice task or the concept check in a figure or
  caption; show the givens, not the derived result.
- Give each SVG a `title`/`desc`, and give every clickable hotspot an equivalent
  native button. Hotspots need `role="button"`, `tabindex="0"` and
  Enter/Space handling.
- Announce results in an element with `role="status"`; put input errors in
  `role="alert"`.
- Never convey state by color alone; add labels, borders or pressed state.
- Prefer manual stepping. Never require animation or timing to understand a
  mechanism, and respect reduced motion.
- Style with tokens only (`pnpm lint` enforces font sizes and colors), scope
  styles to the component so lesson prose styles cannot leak in, and check both
  themes.
- Add a component test in `tests/unit/<widget>.test.tsx` (Testing Library and
  `userEvent`: announcements, accessible names, reset) and a keyboard test in the
  subject's e2e spec that waits for hydration and drives the main interaction.
- Give the widget a static equivalent in the lesson (a table, list or figure),
  inside a "Check after …" disclosure if it would reveal an answer.
- When a figure replaces an older component, delete the unused component.

## Done when

- [ ] Model tests and a component or browser test cover the interaction.
- [ ] The lesson text explains the same mechanism for readers without JavaScript.
- [ ] `pnpm shots <subject>/<lesson>` captures at 390 and 1280 px in both
      themes were inspected, including the widget's later states, with keyboard
      use and announcements checked ([verify-change.md](verify-change.md)).
