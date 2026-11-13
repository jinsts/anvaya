import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const arrays = '/learn/dsa/arrays/';
const pathId = 'dsa-foundations';
const subjectTitle = 'Data Structures & Algorithms';
// DSA plus the seven Engineering Fundamentals subjects, all in Computer Science.
const subjectCount = 8;

async function expectCategory(page: Page, title: string) {
  await expect(page.locator('#browse-title')).toHaveText(title);
  await expect(page.locator('#subject-count')).toHaveText(
    `${subjectCount} subjects`,
  );
  await expect(page.locator('.subject-card').first()).toBeVisible();
}

test('browse categories, open a subject, and begin its learning path', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: 'Explore subjects', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Explore subjects',
  );
  const categories = page.getByRole('navigation', {
    name: 'Subject categories',
  });
  const technology = categories.getByRole('link', {
    name: 'Technology & Engineering',
    exact: true,
  });
  await technology.focus();
  await page.keyboard.press('Enter');
  await expectCategory(page, 'Technology & Engineering');
  await expect(page.locator('#browse-title')).toBeFocused();
  await categories
    .getByRole('link', { name: 'Computer Science', exact: true })
    .click();
  await expectCategory(page, 'Computer Science');
  await expect(page).toHaveURL('/explore/?category=computer-science');
  await expect(
    page
      .getByRole('navigation', { name: 'Category breadcrumb' })
      .getByText('Computer Science', { exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await page.locator('.subject-card[href="/subjects/dsa/"]').click();
  await expect(page).toHaveURL('/subjects/dsa/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    subjectTitle,
  );
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(
    breadcrumb.getByRole('link', { name: 'Technology & Engineering' }),
  ).toHaveAttribute('href', '/explore/?category=technology');
  await expect(
    breadcrumb.getByRole('link', { name: 'Computer Science' }),
  ).toHaveAttribute('href', '/explore/?category=computer-science');
  await expect(page.locator('#subject-lessons-title')).toHaveText(
    'All lessons',
  );
  await page
    .getByRole('main')
    .getByRole('link', { name: subjectTitle, exact: true })
    .click();
  await expect(page).toHaveURL(`/paths/${pathId}/`);
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Foundations' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Begin the path' }).click();
  await expect(page).toHaveURL(arrays);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Arrays: Think in indices',
  );
  expect(errors).toEqual([]);
});

test('category Back, browser history, and direct query restoration', async ({
  page,
}) => {
  await page.goto('/explore/');
  await page.locator('[data-category-id="technology"]').click();
  await expectCategory(page, 'Technology & Engineering');
  await page.locator('[data-category-id="computer-science"]').click();
  await expectCategory(page, 'Computer Science');
  await page.goBack();
  await expectCategory(page, 'Technology & Engineering');
  await page.goForward();
  await expectCategory(page, 'Computer Science');
  await page.reload();
  await expectCategory(page, 'Computer Science');
  await expect(page.locator('#category-back')).toHaveText(
    'Technology & Engineering',
  );
  await page.locator('#category-back').click();
  await expectCategory(page, 'Technology & Engineering');
  await expect(page).toHaveURL('/explore/?category=technology');
  await page.locator('#category-back').click();
  await expectCategory(page, 'All subjects');
  await expect(page).toHaveURL('/explore/');
  await expect(page.locator('#category-back')).toBeHidden();
  await page.goto('/explore/?category=unknown-category');
  await expectCategory(page, 'All subjects');
  await expect(page.locator('#category-back')).toBeHidden();
  await expect(page.locator('[data-category-id="technology"]')).toBeVisible();
});

test('global search reaches indexed lessons and restores query on reload', async ({
  page,
}, info) => {
  await page.goto('/');
  if (info.project.name === 'desktop') {
    const search = page.getByRole('search');
    await search.getByRole('searchbox').fill('memory');
    await search.getByRole('searchbox').press('Enter');
  } else {
    await page
      .getByRole('link', { name: 'Search library', exact: true })
      .click();
    await page.getByRole('main').getByRole('searchbox').fill('memory');
  }
  await expect(page).toHaveURL('/concepts/?q=memory');
  const search = page.getByRole('main').getByRole('searchbox');
  const arraysResult = page
    .locator('#results')
    .getByRole('link', { name: 'Arrays: Think in indices' });
  await expect(search).toHaveValue('memory');
  await expect(page.locator('#search-status')).toContainText('for “memory”');
  await expect(arraysResult).toBeVisible();
  await page.reload();
  await expect(search).toHaveValue('memory');
  await expect(arraysResult).toBeVisible();
  await search.fill('zzqqxv');
  await expect(page.locator('#empty')).toBeVisible();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page).toHaveURL('/concepts/');
  await expect(search).toBeFocused();
  await expect(page.locator('#search-status')).toContainText('Type to search');
  await expect(page.locator('#results li')).toHaveCount(0);
  await expect(page.locator('#empty')).toBeHidden();
});

test('study navigation is contextual and invalid path queries use the default', async ({
  page,
}, info) => {
  for (const url of ['/', '/explore/', '/subjects/dsa/', '/paths/']) {
    await page.goto(url);
    await expect(page.locator('[data-path-sidebar]')).toHaveCount(0);
    await expect(
      page.getByRole('navigation', {
        name: 'Browse subjects',
        includeHidden: true,
      }),
    ).toHaveCount(1);
  }
  for (const query of ['', `?path=${pathId}`, '?path=unknown-path']) {
    await page.goto(`${arrays}${query}`);
    if (info.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
    }
    const sidebar = page.locator(`[data-path-sidebar="${pathId}"]`);
    await expect(sidebar).toBeVisible();
    await expect(page.locator('[data-path-sidebar]:not([hidden])')).toHaveCount(
      1,
    );
    await expect(
      sidebar.getByRole('link', { name: 'Arrays', exact: false }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      page.getByRole('navigation', {
        name: 'Browse subjects',
        includeHidden: true,
      }),
    ).toHaveCount(0);
    if (info.project.name === 'mobile') await page.keyboard.press('Escape');
    const adjacent = page.getByRole('navigation', { name: 'Adjacent lessons' });
    await expect(adjacent.getByRole('link')).toHaveAttribute(
      'href',
      '/learn/dsa/hash-maps/',
    );
    await expect(page.locator('.path-position:not([hidden])')).toContainText(
      'Lesson 1 of 2',
    );
  }
  await page
    .getByRole('navigation', { name: 'Adjacent lessons' })
    .getByRole('link')
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Hash Maps: Find by meaning',
  );
});

test('header discovery and mobile navigation work with the keyboard', async ({
  page,
}, info) => {
  await page.goto('/');
  if (info.project.name === 'desktop') {
    const explore = page.locator('.explore-menu');
    const summary = explore.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(explore).toHaveAttribute('open', '');
    await page.keyboard.press('Tab');
    await expect(
      explore.getByRole('link', { name: 'Explore all subjects' }),
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(explore).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/explore/');
  } else {
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    const navigation = page.getByRole('navigation', {
      name: 'Main navigation',
    });
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(navigation.getByRole('link', { name: 'Home' })).toBeFocused();
    await expect(page.locator('.workspace')).toHaveAttribute('inert', '');
    await page.keyboard.press('Escape');
    await expect(navigation).toBeHidden();
    await expect(menu).toBeFocused();
    await expect(page.locator('.workspace')).not.toHaveAttribute('inert', '');
    await page.keyboard.press('Enter');
    const explore = navigation.getByRole('link', { name: 'Explore' });
    await explore.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/explore/');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.workspace')).not.toHaveAttribute('inert', '');
  }
});

test('a subject with several chapters is grouped on path, subject and lesson pages', async ({
  page,
}) => {
  const subject = 'Computer Architecture & Execution';
  const chapter = 'The memory hierarchy';
  await page.goto('/paths/engineering-fundamentals/');
  // One subject heading, with its chapters beneath it.
  await expect(
    page.getByRole('heading', { level: 2, name: subject }),
  ).toHaveCount(1);
  const chapters = page
    .locator('#subject-computer-architecture-execution')
    .locator('xpath=ancestor::section[1]')
    .getByRole('heading', { level: 3 });
  await expect(chapters).toHaveCount(6);
  await expect(chapters.nth(2)).toHaveText(
    new RegExp(`^Chapter 3 ${chapter}$`),
  );

  // The subject outline links each chapter to its anchor on the path page.
  await page.goto('/subjects/computer-architecture-execution/');
  await expect(page.locator('#future-chapters')).toHaveCount(0);
  await page
    .getByRole('heading', { level: 3, name: `Chapter 3 ${chapter}` })
    .getByRole('link')
    .click();
  await expect(page).toHaveURL(
    '/paths/engineering-fundamentals/#section-architecture-memory-hierarchy',
  );

  // The study sidebar labels the subject once above its chapters (text checks
  // also hold while the mobile sidebar is collapsed).
  await page.goto(
    '/learn/computer-architecture-execution/memory-hierarchy-and-caches/',
  );
  const sidebar = page.locator(
    '[data-path-sidebar="engineering-fundamentals"]',
  );
  await expect(sidebar.locator('.path-subject')).toHaveText(subject);
  await expect(sidebar.locator('.path-section summary')).toHaveText([
    'Machine state and data representation',
    'From source to running process',
    chapter,
    'Devices and the hardware–software boundary',
    'Performance on real hardware',
  ]);
});

test('catalog and subject pages fit both themes and pass accessibility scans', async ({
  page,
}, info) => {
  for (const [name, url] of [
    ['explore', '/explore/?category=computer-science'],
    ['subject', '/subjects/dsa/'],
    ['overview', '/subjects/computer-architecture-execution/'],
    ['spanning-path', '/paths/engineering-fundamentals/'],
  ]) {
    await page.goto(url!);
    for (const theme of ['light', 'dark']) {
      await page
        .getByRole('combobox', { name: 'Color theme' })
        .selectOption(theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(`${name}-${theme}.png`),
        fullPage: true,
      });
      const scan = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        scan.violations.map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.slice(0, 4).map((node) => node.failureSummary),
        })),
      ).toEqual([]);
    }
  }
});
