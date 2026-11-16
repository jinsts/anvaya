import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import SimdLoopStepper from '../../src/components/interactive/SimdLoopStepper';

const status = () => screen.getByRole('status');

it('runs two vector iterations and a two-element remainder for ten ints', async () => {
  const user = userEvent.setup();
  render(<SimdLoopStepper />);
  await user.click(screen.getByRole('button', { name: 'Next iteration' }));
  expect(status()).toHaveTextContent('adds elements 0–3, all 4 lanes at once');
  await user.click(screen.getByRole('button', { name: 'Next iteration' }));
  await user.click(screen.getByRole('button', { name: 'Next iteration' }));
  expect(status()).toHaveTextContent('element 8 is added on its own');
  await user.click(screen.getByRole('button', { name: 'Next iteration' }));
  expect(status()).toHaveTextContent(
    '2 vector iterations and 2 remainder, 4 loop iterations instead of 10',
  );
  expect(
    screen.getByRole('list', { name: 'Elements of out' }),
  ).toHaveTextContent('909');
});

it('recomputes the split for eight lanes and handles an empty array', async () => {
  const user = userEvent.setup();
  render(<SimdLoopStepper />);
  await user.selectOptions(
    screen.getByLabelText('Lanes'),
    '8 (32-byte vectors)',
  );
  await user.selectOptions(
    screen.getByLabelText('Predict: vector iterations'),
    '1',
  );
  await user.selectOptions(screen.getByLabelText('Predict: remainder'), '2');
  for (let i = 0; i < 3; i++)
    await user.click(screen.getByRole('button', { name: 'Next iteration' }));
  expect(status()).toHaveTextContent('Your prediction was correct.');
  const elements = screen.getByLabelText('Elements');
  await user.clear(elements);
  await user.type(elements, '0');
  expect(status()).toHaveTextContent('0 elements');
  expect(screen.queryByRole('button', { name: 'Next iteration' })).toBeNull();
});
