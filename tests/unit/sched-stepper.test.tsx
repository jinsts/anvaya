import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import SchedStepper from '../../src/components/interactive/SchedStepper';
import {
  EXAMPLE,
  simulate,
} from '../../labs/operating-systems-runtime-internals/scheduling/fair';

const { decisions } = simulate(
  EXAMPLE.tasks,
  EXAMPLE.quantum,
  EXAMPLE.duration,
);
const status = () => screen.getByRole('status');
const next = () => screen.getByRole('button', { name: 'Next decision' });
const predict = () => screen.getByLabelText('Predict: who runs next?');

it('scores each prediction against the model and shows the candidates', async () => {
  const user = userEvent.setup();
  render(<SchedStepper />);
  expect(status()).toHaveTextContent('Predict who runs first');
  await user.selectOptions(predict(), 'A');
  await user.click(next());
  expect(status()).toHaveTextContent('At 0 ms (start), A has the lowest');
  expect(status()).toHaveTextContent('Your prediction was correct.');
  await user.selectOptions(predict(), 'A');
  await user.click(next());
  expect(status()).toHaveTextContent('At 3 ms (slice ended), B');
  expect(status()).toHaveTextContent('You predicted A.');
  const runnable = screen.getByRole('list', { name: 'Runnable tasks' });
  expect(runnable).toHaveTextContent('B0.00 ms · runs');
  expect(runnable).toHaveTextContent('A3.00 ms');
});

it('runs every decision and resets', async () => {
  const user = userEvent.setup();
  render(<SchedStepper />);
  for (let i = 0; i < decisions.length; i++) await user.click(next());
  expect(status()).toHaveTextContent(`All ${decisions.length} decisions made`);
  await user.click(screen.getByRole('button', { name: 'Run again' }));
  expect(status()).toHaveTextContent('Predict who runs first');
});
