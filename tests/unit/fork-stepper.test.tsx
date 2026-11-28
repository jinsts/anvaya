import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import ForkStepper from '../../src/components/interactive/ForkStepper';
import {
  LAUNCHER,
  simulate,
} from '../../labs/operating-systems-runtime-internals/processes/process';

const { events } = simulate(LAUNCHER);
const adopt = events.findIndex((e) => e.kind === 'adopt');
const status = () => screen.getByRole('status');
const next = () => screen.getByRole('button', { name: 'Next event' });

it('steps through the launcher and shows a zombie before its reap', async () => {
  const user = userEvent.setup();
  render(<ForkStepper />);
  expect(status()).toHaveTextContent('Predict which process init will adopt');
  const firstExit = events.findIndex((e) => e.kind === 'exit');
  for (let i = 0; i <= firstExit; i++) await user.click(next());
  expect(status()).toHaveTextContent(
    'P2 exits with status 0 and stays a zombie until P1 waits',
  );
  expect(screen.getByText('zombie: exited, not reaped')).toBeInTheDocument();
  await user.click(next());
  expect(status()).toHaveTextContent('P1 reaps P2, status 0');
});

it('scores the adoption prediction and resets', async () => {
  const user = userEvent.setup();
  render(<ForkStepper />);
  await user.selectOptions(
    screen.getByLabelText('Predict: which process will init adopt?'),
    'P5',
  );
  for (let i = 0; i <= adopt; i++) await user.click(next());
  expect(status()).toHaveTextContent('P5 is adopted by init');
  expect(status()).toHaveTextContent('Your prediction was correct.');
  const adopted = screen.getByText('Adopted by init').parentElement!;
  expect(within(adopted).getByText('P5')).toBeInTheDocument();
  for (let i = adopt + 1; i < events.length; i++) await user.click(next());
  expect(status()).toHaveTextContent('Launcher finished');
  expect(status()).toHaveTextContent('or (P5) by init');
  await user.click(screen.getByRole('button', { name: 'Run again' }));
  expect(status()).toHaveTextContent('Predict which process init will adopt');
});
