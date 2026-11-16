import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import DatapathStepper from '../../src/components/interactive/DatapathStepper';

const status = () => screen.getByRole('status');
const value = (row: string) =>
  within(screen.getByRole('table')).getByRole('rowheader', { name: row })
    .nextElementSibling!;
const highlighted = (container: HTMLElement) =>
  [...container.querySelectorAll('.datapath-unit.on text.datapath-label')].map(
    (t) => t.textContent,
  );

it('asks for a prediction, then highlights the load path and updates R0', async () => {
  const user = userEvent.setup();
  const { container } = render(<DatapathStepper />);
  expect(status()).toHaveTextContent('Next: load R0, [1000].');
  expect(highlighted(container)).toEqual([]);
  await user.click(screen.getByRole('button', { name: 'A register' }));
  expect(status()).toHaveTextContent('Your prediction was correct.');
  expect(value('R0')).toHaveTextContent('7');
  expect(highlighted(container)).toContain('Data memory');
  expect(
    container.querySelector('.datapath-wire.on text')?.textContent,
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Next instruction' }),
  ).toHaveFocus();
});

it('shows that only the store writes memory and scores the run', async () => {
  const user = userEvent.setup();
  const { container } = render(<DatapathStepper />);
  await user.click(screen.getByRole('button', { name: 'A register' }));
  await user.click(screen.getByRole('button', { name: 'Next instruction' }));
  await user.click(screen.getByRole('button', { name: 'Data memory' }));
  expect(status()).toHaveTextContent('it was a register');
  expect(highlighted(container)).not.toContain('Data memory');
  expect(value('memory[1000]')).toHaveTextContent('7');
  await user.click(screen.getByRole('button', { name: 'Next instruction' }));
  await user.click(screen.getByRole('button', { name: 'Data memory' }));
  expect(value('memory[1000]')).toHaveTextContent('8');
  await user.click(screen.getByRole('button', { name: 'Finish' }));
  expect(status()).toHaveTextContent('Predictions: 2 of 3 correct.');
  await user.click(screen.getByRole('button', { name: 'Run again' }));
  expect(status()).toHaveTextContent('Next: load R0, [1000].');
});
