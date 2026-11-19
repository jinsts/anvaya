// Per-lesson checks from docs/SUBJECT_STANDARD.md (L9, L11, V1, V3–V5), run
// on every lesson in src/content/lessons, so a new lesson is covered without
// editing a list. Widget-specific keyboard tests live in subject specs.
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const root = 'src/content/lessons';
// Lessons written before the standard; they are revised with enhance-lesson
// and removed from this list once they pass (see "Known exceptions").
const legacy = new Set(['dsa/arrays', 'dsa/hash-maps']);

function lessonIds(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) return lessonIds(full);
    return entry.name.endsWith('.mdx')
      ? [relative(root, full).replace(/\.mdx$/, '')]
      : [];
  });
}
const lessons = lessonIds(root)
  .filter((id) => !legacy.has(id))
  .sort();

test.use({ reducedMotion: 'reduce' });

test('finds the lessons to check', () => {
  expect(lessons.length).toBeGreaterThan(0);
});

for (const id of lessons) {
  test(`lesson standard: ${id}`, async ({ page }) => {
    await page.goto(`/learn/${id}/`);
    const article = page.locator('article.prose');
    // A figure may also sit in a check-after disclosure; one must be visible.
    await expect(
      article.locator('.diagram-frame').filter({ visible: true }).first(),
    ).toBeVisible();
    for (const theme of ['light', 'dark']) {
      await page
        .getByRole('combobox', { name: 'Color theme' })
        .selectOption(theme);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const scan = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        scan.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    }
    const source = article
      .locator('details')
      .filter({
        has: page.locator('summary', { hasText: 'Inspect the tested model' }),
      })
      .first();
    await expect(source).not.toHaveAttribute('open', '');
    await source.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(source).toHaveAttribute('open', '');
    await expect(source.locator('pre').first()).toBeVisible();
    const quiz = article.locator('[data-quiz]');
    await expect(quiz).toHaveCount(1);
    await quiz.locator('input[data-correct="true"]').focus();
    await page.keyboard.press('Space');
    await quiz.getByRole('button', { name: 'Check reasoning' }).click();
    await expect(quiz.getByRole('status')).toContainText('Exactly.');
  });
}

// One test per lesson, so a failure names its lesson, later lessons are still
// checked, and the suite parallelizes as subjects are added.
for (const id of lessons) {
  test(`lesson without JavaScript: ${id}`, async ({ browser }, info) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      reducedMotion: 'reduce',
      viewport:
        info.project.name === 'mobile'
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    await page.goto(
      `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT || 4321}/learn/${id}/`,
    );
    await expect(
      page
        .locator('article.prose .diagram-frame')
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Two-minute recap', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const disclosure = page
      .locator('article.prose details')
      .filter({
        has: page.locator('summary', { hasText: 'Inspect the tested model' }),
      })
      .first();
    await disclosure.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(disclosure.locator('pre').first()).toBeVisible();
    await context.close();
  });
}
