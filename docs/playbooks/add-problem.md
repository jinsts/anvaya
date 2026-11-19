# Add interview problems

A problem is a reference to a reputable problem bank plus original hints. It
appears in its lessons' interview section, the practice tracker and mock
interviews. Problems never contain statements, editorials or solutions.

## Steps

1. Link a problem only when it genuinely applies an idea the linked lesson
   teaches ([standard](../SUBJECT_STANDARD.md) P7). A lesson with no fitting
   problem links none; never pad. Take problems from a registered problem bank
   (`kind: problem-bank`, LeetCode today), prefer ones on registered curated
   lists, and do not link paid-only problems.
2. Check the bank's own slug, title, difficulty and whether the problem is
   paid-only. For LeetCode, its public GraphQL endpoint's `question(titleSlug:)`
   query returns `title`, `difficulty` and `isPaidOnly`; record that you
   checked. If you cannot reach it, say so and do not guess. Then scaffold:

   ```sh
   pnpm new:problem two-sum --title "Two Sum" --url https://leetcode.com/problems/two-sum/ --difficulty easy --lesson dsa/hash-maps
   ```

3. Set `lessons` to every lesson that teaches a needed idea, and `topics` to
   kebab-case tags.
4. Add `lists` only after checking membership in the list's published data:
   - Blind 75 and NeetCode 150: the `blind75` and `neetcode150` flags in
     NeetCode's
     [`.problemSiteData.json`](https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json).
     The `link` field there is the LeetCode slug.
   - For any other list, register it first ([add-source.md](add-source.md)) and
     record where you checked membership in your change description.

   LeetCode blocks automated clients, so take slugs from list data rather than
   guessing them. Leave `lists` empty if you cannot verify membership.

5. Write 2–3 original hints that escalate from the key observation to the
   approach and its complexity. Do not include code.
6. Update the problem counts and the mock-interview list in
   `tests/e2e/practice.spec.ts`, then verify with
   [verify-change.md](verify-change.md).

## Done when

- [ ] The problem applies the lesson's idea, is not paid-only, and its URL
      starts with a registered prefix; title and difficulty were checked
      against the bank.
- [ ] Every listed membership was checked against published list data.
- [ ] Hints are original, contain no code, and agree with the linked lesson.
