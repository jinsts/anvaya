import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import PipelineStepper from '../../src/components/interactive/PipelineStepper';

const status = () => screen.getByRole('status');
const row = (text: string) =>
  within(screen.getByRole('table')).getByRole('rowheader', { name: text })
    .parentElement!;

it('reveals one cycle at a time and explains the load-use wait', async () => {
  const user = userEvent.setup();
  render(<PipelineStepper />);
  expect(row('add r3, r1, r4')).not.toHaveTextContent('IF');
  for (let i = 0; i < 4; i++)
    await user.click(screen.getByRole('button', { name: 'Next cycle' }));
  expect(status()).toHaveTextContent(
    'add r3, r1, r4 waits in ID for r1 from ld r1, 0(r2)',
  );
  expect(row('add r3, r1, r4')).toHaveTextContent('IFIDwait');
});

it('scores the prediction and recomputes when forwarding is turned off', async () => {
  const user = userEvent.setup();
  render(<PipelineStepper />);
  await user.click(screen.getByLabelText('Forwarding'));
  await user.selectOptions(
    screen.getByLabelText('Your prediction: cycles lost'),
    '4',
  );
  await user.click(screen.getByRole('button', { name: 'Run to the end' }));
  expect(status()).toHaveTextContent(
    'Finished in 12 cycles: 4 bubbles and 0 flushed',
  );
  expect(status()).toHaveTextContent('Your prediction was correct.');
  await user.click(screen.getByRole('button', { name: 'Run again' }));
  expect(status()).toHaveTextContent('Predict how many cycles are lost');
});

it('flushes the wrong-path instructions behind a taken branch', async () => {
  const user = userEvent.setup();
  render(<PipelineStepper />);
  await user.selectOptions(screen.getByLabelText('Program'), 'A taken branch');
  for (let i = 0; i < 4; i++)
    await user.click(screen.getByRole('button', { name: 'Next cycle' }));
  expect(status()).toHaveTextContent('beq r1, r0, L resolves in EX: taken');
  await user.click(screen.getByRole('button', { name: 'Next cycle' }));
  expect(status()).toHaveTextContent('sub r3, r3, r4 is flushed');
  expect(row('or r5, r5, r6')).toHaveTextContent('flushed');
});
