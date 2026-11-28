import { expect, test } from '@playwright/test';
const subject = 'operating-systems-runtime-internals';
// Per-lesson checks for every lesson are in lessons.spec.ts; these are the
// keyboard tests for this subject's widgets.
test.use({ reducedMotion: 'reduce' });

test('the process stepper takes a prediction and steps by keyboard', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/processes/`);
  const stepper = page.getByRole('region', {
    name: 'Interactive process stepper',
  });
  await stepper.scrollIntoViewIfNeeded();
  // Astro visible hydration has completed when the island drops `ssr`.
  await expect(page.locator('astro-island').first()).not.toHaveAttribute(
    'ssr',
    '',
  );
  const status = stepper.getByRole('status');
  const prediction = stepper.getByRole('combobox', {
    name: 'Predict: which process will init adopt?',
  });
  await prediction.focus();
  await prediction.selectOption('P5');
  await stepper.getByRole('button', { name: 'Next event' }).focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('P1 forks P2');
  // Focus stays on the button, so Enter keeps stepping.
  for (let i = 0; i < 14; i++) await page.keyboard.press('Enter');
  await expect(status).toContainText('P5 is adopted by init');
  await expect(status).toContainText('Your prediction was correct.');
});

test('the scheduler stepper takes predictions and steps by keyboard', async ({
  page,
}) => {
  await page.goto(`/learn/${subject}/scheduling/`);
  const stepper = page.getByRole('region', {
    name: 'Interactive scheduler stepper',
  });
  await stepper.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island').first()).not.toHaveAttribute(
    'ssr',
    '',
  );
  const status = stepper.getByRole('status');
  const prediction = stepper.getByRole('combobox', {
    name: 'Predict: who runs next?',
  });
  await prediction.focus();
  await prediction.selectOption('A');
  await stepper.getByRole('button', { name: 'Next decision' }).focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText('At 0 ms (start), A');
  await expect(status).toContainText('Your prediction was correct.');
  // Focus stays on the button, so Enter keeps stepping.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(status).toContainText('At 6 ms (slice ended), C');
});
