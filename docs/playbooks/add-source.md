# Register a trusted source

Every lesson citation and every problem URL must start with a prefix
registered in `src/content/sources/`. The build rejects anything else, so new
sources are always a visible, reviewable change.

## What qualifies

- **Accept:** official specifications and documentation; textbooks and course
  material from recognized authors or institutions; widely used interview
  guides and curated lists with named authors; established problem banks.
- **Reject:** content farms, AI-generated summaries, unofficial copies of paid
  material, anonymous posts, and anything you have not opened yourself.

## Steps

1. Open the page and confirm it loads and supports what you will cite.
2. Create `src/content/sources/<id>.yaml`:

   ```yaml
   name: Designing Data-Intensive Applications
   kind: book # specification | documentation | book | course | reference | guide | problem-bank | problem-list
   by: Martin Kleppmann
   url: https://dataintensive.net/
   prefixes: # optional; citations must start with one of these (defaults to url)
     - https://dataintensive.net/
   description: What it is and why it is trustworthy, in one sentence.
   ```

3. Cite specific pages in a lesson's `sources` with a descriptive label. Open
   each cited page and confirm it supports the claim you attach to it; never
   cite a page you have not read ([standard](../SUBJECT_STANDARD.md) E8).
4. Check that the page URLs you will cite start with one of the `prefixes`; a
   site whose chapters live under a different path needs those paths listed.
5. Run `pnpm build`, and name the pages you opened in the change's
   `docs/VERIFICATION.md` entry.

Problem lists (`kind: problem-list`) also need a published membership record
that agents can check ([add-problem.md](add-problem.md)).
