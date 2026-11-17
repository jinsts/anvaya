# Intake questions

Ask before touching anything. Each answer changes the outline, as the right
column says. Ask in three batches of at most four, offering likely answers as
options while always allowing free text. Skip a question only when the owner
has already answered it in this conversation, and say which answer you are
reusing.

## Batch 1: what and why

| Question                                                                                                                              | Why it matters                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Subject.** Which subject? A new one or one of the outline-only subjects in `src/content/subjects/`?                                 | Decides whether to start from an existing overview, planned list and audit.                        |
| **Goals.** What should you be able to do afterwards, at work and in interviews?                                                       | Becomes the coverage map (C1) and the subject's objectives and competencies.                       |
| **Current level.** What do you already know or use daily, and where do you feel unsure?                                               | Sets the starting chapter, the difficulty and what can be a one-line reminder instead of a lesson. |
| **Target roles and interviews.** Which roles and levels, and which interview formats (coding, system design, deep dives, take-homes)? | Shapes interview questions, problem selection and which mechanisms get worked examples.            |

## Batch 2: shape

| Question                                                                                                                                                           | Why it matters                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Depth.** Working understanding, interview-ready, or implementation-level (could build a small one)?                                                              | Decides how many mechanisms get their own page and whether labs simulate or implement.                                |
| **Languages and toolchains.** Which languages and tools should labs use (TypeScript in the gate by default; C, SQL, Go, shell...)?                                 | TypeScript models run in `pnpm verify`; native toolchains need a native lab with recorded artifacts and drift checks. |
| **Hardware and tools available.** Which machine, OS, privileges and tools (for example a native Linux box with `perf`, Docker, a database server, packet capture)? | Decides what the agent can record here and what becomes an owner-run script (E6).                                     |
| **Exclusions.** Anything to leave out, or that another subject should own?                                                                                         | Becomes the boundary (C2) and avoids duplicating neighbouring subjects (C5).                                          |

## Batch 3: sources and time

| Question                                                                                            | Why it matters                                                                               |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Trusted sources.** Books, courses, specifications or authors you trust or own; any to avoid?      | Only registered sources the agent opened are cited (E8). Private material is never imported. |
| **Time budget.** Hours per week, and by when?                                                       | Sets the number of lessons (15–30 minutes each, plus labs) and the drafting order.           |
| **Checkpoints.** After how many lessons should drafting pause for you: every lesson, every chapter? | Sets the checkpoint rhythm in Phase 5.                                                       |
| **Anything else?** Constraints, preferences, examples you liked in the architecture subject.        | Catch what the other questions missed.                                                       |

Record every answer in the proposal's "Intake" section so a later agent can
continue without asking again.
