import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectNoViolations(page: Page) {
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    scan.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes
        .slice(0, 4)
        .map((node) => `${node.target.join(' ')}: ${node.failureSummary}`),
    })),
  ).toEqual([]);
}

test('completing a lesson updates the path, sidebar and home dashboard', async ({
  page,
}, info) => {
  await page.goto('/learn/dsa/arrays/');
  const complete = page
    .getByRole('button', { name: 'Mark as complete' })
    .first();
  await complete.click();
  await expect(
    page.getByRole('button', { name: 'Completed' }).first(),
  ).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/paths/dsa-foundations/');
  const main = page.getByRole('main');
  await expect(main.locator('[data-progress-text]')).toHaveText(
    '1 of 2 complete',
  );
  await expect(main.locator('a[data-lesson-id="dsa/arrays"]')).toHaveAttribute(
    'data-complete',
    '',
  );
  await expect(
    main.getByRole('link', { name: 'Continue with Hash Maps' }),
  ).toHaveAttribute('href', '/learn/dsa/hash-maps/');
  if (info.project.name === 'desktop')
    await expect(
      page.locator('[data-path-sidebar]').getByRole('link', { name: /Arrays/ }),
    ).toHaveAttribute('data-complete', '');

  await page.goto('/');
  await expect(page.locator('[data-continue-label]')).toHaveText(
    'Continue where you left off',
  );
  await expect(
    page.getByRole('link', { name: 'Arrays: Think in indices' }),
  ).toHaveAttribute('href', '/learn/dsa/arrays/');
  await expect(page.locator('[data-progress-text]').first()).toHaveText(
    '1 of 2 complete',
  );
});

test('practice filters, statuses persist, and a mock interview records its outcome', async ({
  page,
}) => {
  await page.goto('/practice/?lesson=dsa/arrays');
  const count = page.locator('[data-problem-count]');
  await expect(count).toHaveText('5 of 17 problems · 0 solved');
  const filters = page.getByRole('form', { name: 'Filter problems' });
  await filters.getByRole('button', { name: 'Reset' }).click();
  await expect(count).toHaveText('17 of 17 problems · 0 solved');
  await filters
    .getByRole('combobox', { name: 'Difficulty' })
    .selectOption('medium');
  await expect(count).toHaveText('5 of 17 problems · 0 solved');
  await expect(page).toHaveURL('/practice/?difficulty=medium');
  await page
    .getByRole('combobox', { name: 'Status for Group Anagrams' })
    .selectOption('solved');
  await expect(count).toHaveText('5 of 17 problems · 1 solved');
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Status for Group Anagrams' }),
  ).toHaveValue('solved');
  await expect(count).toHaveText('5 of 17 problems · 1 solved');

  await page.getByRole('button', { name: 'Start mock interview' }).click();
  const session = page.locator('[data-mock-session]');
  await expect(session).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText(/^4[45]:\d\d$/);
  const problem = await session.locator('[data-mock-problem]').textContent();
  expect([
    'Product of Array Except Self',
    'Top K Frequent Elements',
    'Longest Consecutive Sequence',
    'LRU Cache',
  ]).toContain(problem);
  await page.getByRole('button', { name: 'Needs review' }).click();
  await expect(session).toBeHidden();
  await expect(page.locator('[data-mock-message]')).toHaveText(
    `Recorded ${problem} as needs review.`,
  );
  await expect(
    page.getByRole('combobox', { name: `Status for ${problem}` }),
  ).toHaveValue('review');
});

test('question drill reveals answers and brings review items back first', async ({
  page,
}) => {
  await page.goto('/practice/questions/dsa/?lesson=dsa/hash-maps');
  const drill = page.getByRole('region', { name: 'Question drill' });
  const progress = drill.locator('[data-drill-progress]');
  await expect(progress).toHaveText('Question 1 of 5 · 0 marked for review');
  const firstPrompt = await drill.locator('[data-drill-prompt]').textContent();
  await drill.getByRole('button', { name: 'Reveal answer' }).click();
  await expect(drill.locator('[data-drill-answer]')).toBeVisible();
  await drill.getByRole('button', { name: 'I explained it well' }).click();
  await expect(progress).toHaveText('Question 2 of 5 · 0 marked for review');
  const secondPrompt = await drill.locator('[data-drill-prompt]').textContent();
  await drill.getByRole('button', { name: 'Reveal answer' }).click();
  await drill.getByRole('button', { name: 'Review again' }).click();
  await expect(progress).toHaveText('Question 3 of 5 · 1 marked for review');
  await page.reload();
  await expect(drill.locator('[data-drill-prompt]')).toHaveText(secondPrompt!);
  await expect(drill.locator('[data-drill-prompt]')).not.toHaveText(
    firstPrompt!,
  );
});

test('practice, drill, search and home pass accessibility scans in both themes', async ({
  page,
}) => {
  for (const url of [
    '/',
    '/practice/',
    '/practice/questions/',
    '/practice/questions/dsa/',
    '/concepts/?q=array',
  ]) {
    await page.goto(url);
    for (const theme of ['light', 'dark']) {
      await page
        .getByRole('combobox', { name: 'Color theme' })
        .selectOption(theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      // Theme changes must not animate colors (and scans need final colors).
      expect(
        await page.evaluate(
          () =>
            document
              .getAnimations()
              .filter((animation) => animation.playState === 'running').length,
        ),
      ).toBe(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expectNoViolations(page);
    }
  }
});
