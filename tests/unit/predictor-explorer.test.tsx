import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import PredictorExplorer from '../../src/components/interactive/PredictorExplorer';

const status = () => screen.getByRole('status');
const current = () =>
  screen
    .getByRole('list', { name: 'Predictor state' })
    .querySelector('[aria-current]');

it('steps the two-bit counter through a loop branch and scores calls', async () => {
  const user = userEvent.setup();
  render(<PredictorExplorer />);
  expect(current()).toHaveTextContent('weakly not taken');
  await user.click(screen.getByRole('button', { name: 'It will mispredict' }));
  expect(status()).toHaveTextContent('State 1 → 2. Your call was right.');
  expect(current()).toHaveTextContent('weakly taken');
  for (let i = 0; i < 4; i++)
    await user.click(screen.getByRole('button', { name: 'It will be right' }));
  // The loop exit: a strongly taken counter mispredicts the not-taken branch.
  await user.click(screen.getByRole('button', { name: 'It will be right' }));
  expect(status()).toHaveTextContent('Branch 6 was not taken');
  expect(status()).toHaveTextContent('Your call was not.');
  while (screen.queryByRole('button', { name: 'Just reveal' }))
    await user.click(screen.getByRole('button', { name: 'Just reveal' }));
  expect(status()).toHaveTextContent(
    'Accuracy 79% (19 of 24). Your calls: 5 of 6.',
  );
});

it('switches to a one-bit predictor and restarts', async () => {
  const user = userEvent.setup();
  render(<PredictorExplorer />);
  await user.selectOptions(
    screen.getByLabelText('Predictor'),
    'One-bit: repeat the last outcome',
  );
  expect(current()).toHaveTextContent('predict not taken');
  while (screen.queryByRole('button', { name: 'Just reveal' }))
    await user.click(screen.getByRole('button', { name: 'Just reveal' }));
  expect(status()).toHaveTextContent('Accuracy 67% (16 of 24).');
  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.getByLabelText('Predictor')).toHaveValue('two-bit');
});
