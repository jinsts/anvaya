import { expect, test } from '@playwright/test';
const subject = 'computer-architecture-execution';
// Per-lesson checks for every lesson are in lessons.spec.ts; these are the
// keyboard tests for this subject's widgets and its paper-task cards.
test.use({ reducedMotion: 'reduce' });

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

test('the byte explorer flips the sign bit and scores flag predictions by keyboard', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/binary-and-data-representation/`);
  const explorer = page.getByRole('region', {
    name: 'Interactive byte explorer',
  });
  await explorer.scrollIntoViewIfNeeded();
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  const status = explorer.getByRole('status');
  await explorer.getByRole('button', { name: /^Bit 7,/ }).focus();
  await page.keyboard.press('Space');
  await expect(status).toContainText('signed −1 → 127');

  await explorer.getByLabel('Carry?').focus();
  await explorer.getByLabel('Carry?').selectOption('no');
  await explorer.getByRole('button', { name: 'Add and reveal' }).focus();
  await page.keyboard.press('Enter');
  // 127 + 1: no carry, signed overflow.
  await expect(status).toContainText('fits in 8 bits, so no carry (correct)');
  await expect(status).toContainText('signed overflow is set (no prediction)');
});

test('the datapath stepper predicts and steps by keyboard', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/how-computers-execute-programs/`);
  const stepper = page.getByRole('region', {
    name: 'Interactive datapath stepper',
  });
  await stepper.scrollIntoViewIfNeeded();
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  const status = stepper.getByRole('status');
  await stepper.getByRole('button', { name: 'A register' }).focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Your prediction was correct.');
  await expect(
    stepper.getByRole('button', { name: 'Next instruction' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Next: add R0, R0, 1.');
});

test('the assembly stepper asks for jump predictions by keyboard', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/reading-assembly/`);
  const stepper = page.getByRole('region', {
    name: 'Interactive assembly stepper',
  });
  await stepper.scrollIntoViewIfNeeded();
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  const status = stepper.getByRole('status');
  const step = stepper.getByRole('button', { name: 'Step', exact: true });
  await step.focus();
  await page.keyboard.press('Enter'); // endbr64
  await page.keyboard.press('Enter'); // testl
  await expect(status).toContainText('Next: jle .L4');
  await stepper
    .getByRole('button', { name: 'Predict: it falls through' })
    .focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Your prediction was correct.');
  await expect(step).toBeFocused();
  await stepper
    .getByRole('combobox', { name: 'Program' })
    .selectOption('scale-o2');
  await stepper.getByRole('button', { name: 'Run to the end' }).click();
  await expect(status).toContainText('Returned 48 in eax');
});

test('the call stack stepper asks before each lifetime question by keyboard', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/stack-and-heap/`);
  const stepper = page.getByRole('region', {
    name: 'Interactive call stack stepper',
  });
  await stepper.scrollIntoViewIfNeeded();
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  const status = stepper.getByRole('status');
  const next = stepper.getByRole('button', { name: 'Next event' });
  await next.focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press('Enter');
  await expect(status).toContainText('what happens to the 128-byte buffer?');
  await stepper.getByRole('button', { name: 'It stays allocated' }).focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Your prediction was correct.');
  // The next event asks its own question rather than being skipped.
  await expect(status).toContainText('After free(data), what does data hold?');
});

test('the pipeline stepper advances cycles by keyboard and explains a bubble', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/pipelining-and-hazards/`);
  const stepper = page.getByRole('region', {
    name: 'Interactive pipeline stepper',
  });
  await stepper.scrollIntoViewIfNeeded();
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  const status = stepper.getByRole('status');
  await stepper.getByLabel('Your prediction: cycles lost').selectOption('1');
  const next = stepper.getByRole('button', { name: 'Next cycle' });
  await next.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('Enter');
  await expect(status).toContainText('add r3, r1, r4 waits in ID for r1');
  await stepper.getByRole('button', { name: 'Run to the end' }).click();
  await expect(status).toContainText('Your prediction was correct.');
});

test('the branch predictor takes calls and reports accuracy by keyboard', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/branch-prediction-and-speculation/`);
  const explorer = page.getByRole('region', {
    name: 'Interactive branch predictor',
  });
  await explorer.scrollIntoViewIfNeeded();
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  const status = explorer.getByRole('status');
  await explorer.getByRole('button', { name: 'It will mispredict' }).focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('mispredicted');
  await expect(status).toContainText('Your call was right.');
  await explorer
    .getByRole('combobox', { name: 'Branch outcomes' })
    .selectOption('alternating');
  await expect(status).toContainText('starts in "weakly not taken"');
});

test('the vector loop stepper splits a loop by keyboard', async ({ page }) => {
  await page.goto(`/learn/${subject}/simd-and-data-parallelism/`);
  const stepper = page.getByRole('region', {
    name: 'Interactive vector loop stepper',
  });
  await stepper.scrollIntoViewIfNeeded();
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  const status = stepper.getByRole('status');
  await stepper.getByLabel('Predict: vector iterations').selectOption('2');
  await stepper.getByLabel('Predict: remainder').selectOption('2');
  const next = stepper.getByRole('button', { name: 'Next iteration' });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('adds elements 0–3');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Enter');
  await expect(status).toContainText('Your prediction was correct.');
});

test('the MESI stepper checks predictions by keyboard', async ({ page }) => {
  await page.goto(`/learn/${subject}/multicore-coherence-and-atomics/`);
  const stepper = page.getByRole('region', {
    name: 'Interactive MESI stepper',
  });
  await stepper.scrollIntoViewIfNeeded();
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  const status = stepper.getByRole('status');
  await stepper.getByLabel('Predict: Core A').selectOption('E');
  await stepper.getByLabel('Predict: Core B').selectOption('I');
  const run = stepper.getByRole('button', { name: 'Run this access' });
  await run.focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Your prediction was correct.');
  await expect(status).toContainText('States: A E, B I.');
  await page.keyboard.press('Enter');
  await expect(status).toContainText('drops to Shared');
  await page.keyboard.press('Enter');
  await expect(status).toContainText('request for ownership');
  for (let i = 0; i < 4; i++) await page.keyboard.press('Enter');
  await expect(status).toContainText('Ownership requests: 3 of 7 accesses.');
  await expect(status).toContainText('Predictions: 1 of 1.');
});

test('the DMA stepper refuses an early reclaim by keyboard', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/io-mechanisms/`);
  const stepper = page.getByRole('region', {
    name: 'Interactive DMA ownership stepper',
  });
  await stepper.scrollIntoViewIfNeeded();
  await expect(
    page.locator('astro-island[component-export="default"]'),
  ).not.toHaveAttribute('ssr', '');
  const status = stepper.getByRole('status');
  await stepper.getByLabel('Predict: owner afterwards').selectOption('device');
  await stepper.getByRole('button', { name: 'Driver submits' }).focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Your prediction was correct.');
  await stepper.getByLabel('Predict: owner afterwards').selectOption('refused');
  await stepper.getByRole('button', { name: 'Driver reclaims' }).focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('Refused: the request is still in flight');
  await expect(status).toContainText('predictions 2 of 2');
});

test('a paper task card shows no test command', async ({ page }) => {
  await page.goto(`/learn/${subject}/hardware-software-interaction/`);
  const cards = page.locator('article.prose .lab-card');
  const attempt = cards.filter({ hasText: '01 /' });
  const paper = cards.filter({ hasText: '02 / Audit a device handoff' });
  await expect(attempt.locator('.lab-run code')).toHaveText(
    `pnpm lab ${subject}/hardware-software-interaction`,
  );
  await expect(paper).toBeVisible();
  await expect(paper.locator('.lab-run')).toHaveCount(0);
});
