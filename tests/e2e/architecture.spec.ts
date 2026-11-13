import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const subject = 'computer-architecture-execution';
const slugs = [
  'how-computers-execute-programs',
  'binary-and-data-representation',
  'cpu-registers-and-instructions',
  'compilation-and-execution',
  'memory-hierarchy-and-caches',
  'stack-and-heap',
  'hardware-software-interaction',
  'io-mechanisms',
  'architecture-and-performance',
];
test.use({ reducedMotion: 'reduce' });
for (const slug of slugs) {
  test(`architecture diagram, disclosure and quiz: ${slug}`, async ({
    page,
  }, info) => {
    await page.goto(`/learn/${subject}/${slug}/`);
    const article = page.locator('article.prose');
    await expect(article.locator('.diagram-frame').first()).toBeVisible();
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
      if (slug === 'cpu-registers-and-instructions')
        await page.screenshot({
          path: info.outputPath(`fields-${theme}.png`),
          fullPage: false,
        });
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
    await quiz.locator('input[data-correct="true"]').focus();
    await page.keyboard.press('Space');
    await quiz.getByRole('button', { name: 'Check reasoning' }).click();
    await expect(quiz.getByRole('status')).toContainText('Exactly.');
  });
}
test('all architecture lessons retain diagrams and working source disclosures without JavaScript', async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
    viewport:
      info.project.name === 'mobile'
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  for (const slug of slugs) {
    await page.goto(
      `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT || 4321}/learn/${subject}/${slug}/`,
    );
    await expect(
      page.locator('article.prose .diagram-frame').first(),
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
  }
  await context.close();
});
