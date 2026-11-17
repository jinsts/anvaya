// Capture a lesson's figures for visual review (docs/playbooks/verify-change.md).
//
//   pnpm build && pnpm shots <subject>/<lesson> [--select "<css>"] [--port 4361] [--out screenshots]
//
// Serves the built site with `astro preview`, then captures every figure and
// widget in the lesson at 1280 px and 390 px in light and dark themes, plus
// the page at 390 px with JavaScript disabled. Writes PNGs and report.json
// (page overflow, elements wider than the viewport, console errors) to
// screenshots/<lesson>/, which Git ignores. Look at every image: the report
// catches overflow, not clipped labels or collisions.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';

const args = process.argv.slice(2);
const option = (name: string, fallback: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1]! : fallback;
};
const lesson = args.find(
  (a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'),
);
if (!lesson || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(lesson)) {
  console.error(
    'Usage: pnpm shots <subject>/<lesson> [--select "<css>"] [--port 4361]',
  );
  process.exit(1);
}
if (!existsSync(join('dist', 'learn', lesson, 'index.html'))) {
  console.error(`✖ dist has no /learn/${lesson}/; run pnpm build first.`);
  process.exit(1);
}
const port = Number(option('port', '4361'));
const out = join(option('out', 'screenshots'), lesson.replace('/', '--'));
const selector = option(
  'select',
  'article.prose .diagram-frame, article.prose astro-island > :first-child',
);
const widths = [1280, 390];
const themes = ['light', 'dark'] as const;
const base = `http://127.0.0.1:${port}`;

async function waitForServer(url: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Preview did not start at ${url}`);
}

async function prepare(page: Page) {
  await page.addStyleTag({
    content:
      'header.topbar { position: static !important } .skip { display: none !important }',
  });
  await page.evaluate(() => document.fonts.ready);
}

/** Elements that extend past the viewport, outside regions meant to scroll. */
function overflow(page: Page) {
  return page.evaluate(() => {
    const width = innerWidth;
    const offenders = [...document.querySelectorAll('article.prose *')]
      .filter((element) => {
        if (element.closest('.table-scroll, pre, [data-scroll]')) return false;
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.right > width + 1;
      })
      .slice(0, 5)
      .map((element) => {
        const name = element.tagName.toLowerCase();
        const className = element.getAttribute('class');
        return className ? `${name}.${className.split(' ')[0]}` : name;
      });
    return {
      pageOverflow: document.documentElement.scrollWidth - width,
      offenders,
    };
  });
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const server = spawn(
  'pnpm',
  ['exec', 'astro', 'preview', '--host', '127.0.0.1', '--port', String(port)],
  { stdio: 'ignore', detached: true },
);
const report: Record<string, unknown>[] = [];
let failed = false;
try {
  await waitForServer(`${base}/`);
  const browser = await chromium.launch();
  for (const width of widths)
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      });
      await context.addInitScript(
        (value) => localStorage.setItem('anvaya:theme:v1', value),
        theme,
      );
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${base}/learn/${lesson}/`, { waitUntil: 'networkidle' });
      await prepare(page);
      const figures = page.locator(selector);
      const count = await figures.count();
      for (let index = 0; index < count; index++) {
        const figure = figures.nth(index);
        if (!(await figure.isVisible())) continue;
        await figure.screenshot({
          path: join(
            out,
            `${width}-${theme}-${String(index + 1).padStart(2, '0')}.png`,
          ),
        });
      }
      const layout = await overflow(page);
      if (layout.pageOverflow > 0 || layout.offenders.length || errors.length)
        failed = true;
      report.push({ width, theme, figures: count, ...layout, errors });
      await context.close();
    }
  const context = await browser.newContext({
    viewport: { width: 390, height: 900 },
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(`${base}/learn/${lesson}/`);
  await page.screenshot({
    path: join(out, '390-no-js-page.png'),
    fullPage: true,
  });
  const layout = await overflow(page);
  if (layout.pageOverflow > 0 || layout.offenders.length) failed = true;
  report.push({ width: 390, theme: 'default', javaScript: false, ...layout });
  await context.close();
  await browser.close();
} finally {
  try {
    if (server.pid) process.kill(-server.pid);
  } catch {
    // The preview already exited.
  }
}
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
for (const row of report)
  console.log(
    `${row.width} px ${row.theme}${row.javaScript === false ? ' (no JavaScript)' : ''}: ` +
      `${row.figures ?? 'page'} captured, overflow ${row.pageOverflow} px` +
      `${(row.offenders as string[]).length ? `, wide: ${(row.offenders as string[]).join(', ')}` : ''}` +
      `${(row.errors as string[] | undefined)?.length ? `, errors: ${(row.errors as string[]).join(' | ')}` : ''}`,
  );
console.log(
  `Images and report.json in ${out}/. Inspect every image before committing.`,
);
if (failed) process.exitCode = 1;
