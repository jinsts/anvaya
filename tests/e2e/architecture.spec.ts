import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const subject = 'computer-architecture-execution';
const slugs = [
  'how-computers-execute-programs',
  'binary-and-data-representation',
  'floating-point-representation',
  'text-encoding-and-memory-layout',
  'cpu-registers-and-instructions',
  'compilation-and-execution',
  'memory-hierarchy-and-caches',
  'cache-organization',
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

test('the cache explorer takes a prediction and changes organization by keyboard', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/cache-organization/`);
  const explorer = page.getByRole('region', {
    name: 'Interactive cache explorer',
  });
  await explorer.scrollIntoViewIfNeeded();
  // Astro visible hydration has completed when the island drops `ssr`.
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  const status = explorer.getByRole('status');
  await expect(status).toContainText('Next: read address 0');

  await explorer.getByRole('button', { name: 'Predict miss' }).focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Miss (compulsory)');
  await expect(status).toContainText('You predicted miss: correct.');

  const organization = explorer.getByRole('combobox', { name: 'Organization' });
  await organization.focus();
  await page.keyboard.press('ArrowDown');
  await expect(organization).toHaveValue('two-way');
  await expect(status).toContainText('Next: read address 0');
  await expect(explorer.getByRole('table')).toContainText('Way 1');
});

test('the binary32 explorer flips bits and takes a prediction by keyboard', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/floating-point-representation/`);
  const explorer = page.getByRole('region', {
    name: 'Interactive binary32 explorer',
  });
  await explorer.scrollIntoViewIfNeeded();
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  const status = explorer.getByRole('status');

  await explorer.getByRole('button', { name: /^Bit 31,/ }).focus();
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
  await expect(
    explorer.getByRole('button', { name: /^Bit 23,/ }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('The value changes from 1 to 0.5.');

  await explorer.getByRole('button', { name: '16,777,216' }).focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Your prediction was correct.');
  await expect(
    explorer.getByRole('button', { name: 'Next challenge' }),
  ).toBeFocused();
});

test('the layout explorer reorders fields by keyboard and keeps focus', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/text-encoding-and-memory-layout/`);
  const explorer = page.getByRole('region', {
    name: 'Interactive record layout explorer',
  });
  await explorer.scrollIntoViewIfNeeded();
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  await expect(explorer).toContainText('sizeof = 24 bytes');
  const up = explorer.getByRole('button', { name: 'Move ratio up' });
  await up.focus();
  await page.keyboard.press('Enter');
  await expect(explorer.getByRole('status')).toContainText(
    'Size 24 → 16 bytes',
  );
  // ratio is now first, so its up button is disabled and focus moves down.
  await expect(
    explorer.getByRole('button', { name: 'Move ratio down' }),
  ).toBeFocused();
});
