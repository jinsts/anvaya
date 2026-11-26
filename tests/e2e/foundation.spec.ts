import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const arrays = '/learn/dsa/arrays/';
async function openExplorer(page: Page) {
  await page.goto(arrays);
  const explorer = page.getByRole('region', {
    name: 'Interactive array explorer',
  });
  await explorer.scrollIntoViewIfNeeded();
  await expect(
    explorer.getByRole('combobox', { name: 'Operation', exact: true }),
  ).toBeEnabled();
  // Astro visible hydration has completed when the React event handler responds.
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  return explorer;
}
async function finishOperation(page: Page) {
  const next = page.getByRole('button', { name: 'Next step →' });
  for (let count = 0; count < 40 && (await next.count()); count++)
    await next.click();
  await expect(
    page.getByRole('button', { name: 'Operation complete' }),
  ).toBeDisabled();
}

test('home → path → Arrays → Hash Maps with generated navigation', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (
      response.url().startsWith('http://127.0.0.1') &&
      response.status() >= 400
    )
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('/');
  await page
    .getByRole('combobox', { name: 'Color theme' })
    .selectOption('light');
  await page.screenshot({
    path: info.outputPath('home-light.png'),
    fullPage: true,
  });
  await page
    .getByRole('main')
    .getByRole('link', { name: 'Data Structures & Algorithms', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Data Structures & Algorithms',
  );
  await page.getByRole('link', { name: 'Begin the path' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Arrays: Think in indices',
  );
  const outline = page.getByRole('navigation', { name: 'On this page' });
  // Narrow layouts collapse the outline into a disclosure.
  if (info.project.name === 'mobile') await outline.locator('summary').click();
  await outline.getByRole('link', { name: 'Two-minute recap' }).click();
  await expect(page).toHaveURL(/#two-minute-recap$/);
  await expect(
    page.getByRole('heading', { name: 'Two-minute recap' }),
  ).toBeInViewport();
  await page
    .getByRole('navigation', { name: 'Adjacent lessons' })
    .getByRole('link')
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hash Maps: Find by meaning',
  );
  await page
    .getByRole('navigation', { name: 'Adjacent lessons' })
    .getByRole('link')
    .click();
  await expect(page).toHaveURL(arrays);
  expect(errors).toEqual([]);
});

test('manual insert trace, labels, reset, and accessible keyboard selection', async ({
  page,
}, info) => {
  const explorer = await openExplorer(page);
  await explorer.getByRole('button', { name: 'Prepare operation' }).click();
  await expect(explorer.getByRole('status')).toContainText('Predict first');
  await expect(
    explorer.getByRole('combobox', { name: 'Operation', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Next step →' }).focus();
  await page.keyboard.press('Enter');
  await expect(explorer.getByRole('status')).toContainText(
    'Allocate a new buffer',
  );
  await finishOperation(page);
  await expect(explorer.getByRole('status')).toContainText(
    '[12, 24, 30, 36, 48]',
  );
  await expect(
    explorer.getByRole('button', { name: 'Index 2, value 30, inserted' }),
  ).toBeVisible();
  await expect(
    explorer.getByRole('button', { name: 'Index 4, value 48, shifted' }),
  ).toBeVisible();
  await explorer.screenshot({ path: info.outputPath('explorer-insert.png') });
  await explorer.getByRole('button', { name: 'Reset', exact: true }).click();
  await explorer
    .getByRole('button', { name: 'Index 2, value 36', exact: true })
    .focus();
  await page.keyboard.press('Enter');
  await expect(explorer.getByRole('status')).toContainText(
    'Index 2 contains 36',
  );
  await explorer
    .getByRole('combobox', { name: 'Operation', exact: true })
    .selectOption('remove');
  await explorer.getByLabel('Index', { exact: true }).fill('1');
  await explorer.getByRole('button', { name: 'Prepare operation' }).click();
  await finishOperation(page);
  await expect(
    explorer.getByRole('button', { name: 'Index 1, value 36, shifted' }),
  ).toBeVisible();
});

test('empty input, insertion at end, invalid index, update and append', async ({
  page,
}) => {
  const explorer = await openExplorer(page);
  await explorer.getByText('Try your own small example').click();
  await explorer.getByLabel(/Comma-separated/).fill('');
  await explorer.getByRole('button', { name: 'Load example' }).click();
  await explorer
    .getByRole('combobox', { name: 'Operation', exact: true })
    .selectOption('read');
  await explorer.getByLabel('Index', { exact: true }).fill('0');
  await explorer.getByRole('button', { name: 'Prepare operation' }).click();
  await expect(explorer.getByRole('alert')).toContainText('empty');
  await explorer
    .getByRole('combobox', { name: 'Operation', exact: true })
    .selectOption('insert');
  await explorer.getByRole('button', { name: 'Prepare operation' }).click();
  await finishOperation(page);
  await expect(explorer.getByRole('status')).toContainText('[30]');
  await explorer.getByLabel('Index', { exact: true }).fill('1');
  await explorer.getByLabel('Value', { exact: true }).fill('7');
  await explorer.getByRole('button', { name: 'Prepare operation' }).click();
  await finishOperation(page);
  await expect(explorer.getByRole('status')).toContainText('[30, 7]');
  await explorer.getByLabel('Index', { exact: true }).fill('4');
  await explorer.getByRole('button', { name: 'Prepare operation' }).click();
  await expect(explorer.getByRole('alert')).toContainText('0 to 2');
  await explorer
    .getByRole('combobox', { name: 'Operation', exact: true })
    .selectOption('update');
  await explorer.getByLabel('Index', { exact: true }).fill('0');
  await explorer.getByLabel('Value', { exact: true }).fill('9');
  await explorer.getByRole('button', { name: 'Prepare operation' }).click();
  await finishOperation(page);
  await expect(
    explorer.getByRole('button', { name: 'Index 0, value 9, updated' }),
  ).toBeVisible();
  await explorer
    .getByRole('combobox', { name: 'Operation', exact: true })
    .selectOption('append');
  await explorer.getByRole('button', { name: 'Prepare operation' }).click();
  await finishOperation(page);
  await expect(explorer.getByRole('status')).toContainText('[9, 7, 9]');
});

test('SVG and equivalent buttons support selection, feedback and keyboard', async ({
  page,
}) => {
  await page.goto(arrays);
  const diagram = page.locator('.indexed-memory');
  await diagram.getByRole('button', { name: 'Index 2', exact: true }).click();
  await expect(diagram.getByRole('status')).toContainText(
    '1000 + 2 × 4 = 1008',
  );
  const hotspot = diagram.locator('g[data-memory-index="3"]');
  await hotspot.focus();
  await page.keyboard.press('Space');
  await expect(diagram.getByRole('status')).toContainText('value 48');
  await expect(hotspot).toHaveAttribute('aria-pressed', 'true');
  await expect(
    diagram.getByRole('button', { name: 'Index 3', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('themes persist, system changes, reduced motion, narrow layout and a11y', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page
    .getByRole('combobox', { name: 'Color theme' })
    .selectOption('system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page
    .getByRole('combobox', { name: 'Color theme' })
    .selectOption('light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  for (const theme of ['light', 'dark']) {
    await page
      .getByRole('combobox', { name: 'Color theme' })
      .selectOption(theme);
    expect(
      await page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((animation) => animation.playState === 'running').length,
      ),
    ).toBe(0);
    await page.screenshot({
      path: info.outputPath(`home-${theme}.png`),
      fullPage: true,
    });
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      scan.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.slice(0, 4).map((n) => n.failureSummary),
      })),
    ).toEqual([]);
    await page.goto(arrays);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const explorer = page.getByRole('region', {
      name: 'Interactive array explorer',
    });
    await explorer.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`lesson-${theme}.png`) });
    const lessonScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      lessonScan.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.slice(0, 4).map((n) => n.failureSummary),
      })),
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto('/');
  }
  await page.setViewportSize({ width: 720, height: 600 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto(arrays);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('blocked storage still allows reading and switching theme', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', {
      value() {
        throw new DOMException('Storage disabled', 'SecurityError');
      },
    });
    Object.defineProperty(Storage.prototype, 'setItem', {
      value() {
        throw new DOMException('Storage disabled', 'SecurityError');
      },
    });
  });
  await page.goto(arrays);
  await page
    .getByRole('combobox', { name: 'Color theme' })
    .selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.getByRole('heading', { name: 'Arrays: Think in indices' }),
  ).toBeVisible();
});

test('full-text search, quiz feedback, and mobile navigation', async ({
  page,
}, info) => {
  await page.goto('/concepts/');
  const search = page.getByRole('main').getByRole('searchbox');
  const results = page.locator('#results');
  await search.fill('memory');
  await expect(
    results.getByRole('link', { name: 'Arrays: Think in indices' }),
  ).toBeVisible();
  // Pagefind also matches an indexed word that begins the query, so an
  // empty search needs a first letter that is never a word on its own: a
  // lone "z" now appears (a zombie's process state), "a" never matches.
  await search.fill('aqqjjxv');
  await expect(page.locator('#empty')).toBeVisible();
  await search.fill('collision');
  await expect(
    results.getByRole('link', { name: 'Hash Maps: Find by meaning' }),
  ).toBeVisible();
  await page.goto(arrays);
  const quiz = page.locator('[data-quiz]');
  await quiz
    .getByRole('radio', { name: 'Every insertion must double capacity.' })
    .check();
  await quiz.getByRole('button', { name: 'Check reasoning' }).click();
  await expect(quiz.getByRole('status')).toContainText('Reconsider.');
  await quiz.getByRole('button', { name: 'Try again' }).click();
  await expect(quiz.getByRole('status')).toBeEmpty();
  await quiz
    .getByRole('radio', {
      name: 'All n existing values must shift right to preserve order.',
    })
    .check();
  await quiz.getByRole('button', { name: 'Check reasoning' }).click();
  await expect(quiz.getByRole('status')).toContainText('Exactly.');
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Menu', exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }),
    ).not.toBeVisible();
  }
});

test('lessons remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(arrays);
  await expect(
    page.getByRole('heading', { name: 'Arrays: Think in indices' }),
  ).toBeVisible();
  await expect(page.getByText('The same insertion in words:')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Two-minute recap' }),
  ).toBeAttached();
  await context.close();
});
