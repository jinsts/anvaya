import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import CacheExplorer from '../../src/components/interactive/CacheExplorer';

const status = () => screen.getByRole('status');
const cell = (set: number, way: number) => {
  const rows = within(screen.getByRole('table')).getAllByRole('row');
  // Row 0 is the header.
  return rows[set + 1]!.querySelectorAll('td')[way]!;
};

it('asks for a prediction first, then explains the placement and scores it', async () => {
  const user = userEvent.setup();
  render(<CacheExplorer />);
  expect(status()).toHaveTextContent('Next: read address 0');
  expect(
    screen.getByRole('list', { name: 'Address 0 as 8 bits' }),
  ).toHaveTextContent('tag 0');
  await user.click(screen.getByRole('button', { name: 'Predict miss' }));
  expect(status()).toHaveTextContent(
    'Read 0: block 0 → set 0, tag 0. Miss (compulsory)',
  );
  expect(status()).toHaveTextContent('You predicted miss: correct.');
  expect(cell(0, 0)).toHaveTextContent('block 0');
  expect(cell(0, 0)).toHaveTextContent('this access');

  // Address 64 is block 4, which also maps to set 0 of the direct-mapped cache.
  await user.click(screen.getByRole('button', { name: 'Predict hit' }));
  expect(status()).toHaveTextContent('Evicted block 0');
  expect(status()).toHaveTextContent('You predicted hit: not this time.');
});

it('shows conflict misses disappearing as associativity grows', async () => {
  const user = userEvent.setup();
  render(<CacheExplorer />);
  const runAll = async () => {
    while (screen.queryByRole('button', { name: 'Reveal without predicting' }))
      await user.click(
        screen.getByRole('button', { name: 'Reveal without predicting' }),
      );
  };
  await runAll();
  expect(status()).toHaveTextContent('3 compulsory, 3 conflict, 0 capacity');
  expect(status()).toHaveTextContent('Predictions: 0 of 0 correct.');

  // Changing the organization restarts the same stream.
  await user.selectOptions(
    screen.getByLabelText('Organization'),
    'Fully associative: 1 set × 4 ways',
  );
  expect(status()).toHaveTextContent('Next: read address 0');
  expect(
    screen.getByRole('list', { name: 'Address 0 as 8 bits' }),
  ).not.toHaveTextContent(/\bset\b/);
  await runAll();
  expect(status()).toHaveTextContent(
    '3 hits, 3 misses (3 compulsory, 0 conflict',
  );
});

it('counts next-level writes under each write policy and resets', async () => {
  const user = userEvent.setup();
  render(<CacheExplorer />);
  await user.selectOptions(
    screen.getByLabelText('Access stream'),
    'Stores to one line',
  );
  const runAll = async () => {
    for (let i = 0; i < 6; i++)
      await user.click(
        screen.getByRole('button', { name: 'Reveal without predicting' }),
      );
  };
  await runAll();
  expect(status()).toHaveTextContent('Next-level writes: 1.');
  await user.selectOptions(
    screen.getByLabelText('Write policy'),
    'Write-through',
  );
  await runAll();
  expect(status()).toHaveTextContent('Next-level writes: 3.');

  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.getByLabelText('Access stream')).toHaveValue('collide');
  expect(screen.getByLabelText('Write policy')).toHaveValue('write-back');
  expect(status()).toHaveTextContent('Next: read address 0');
});

it('marks the next victim once a set is full', async () => {
  const user = userEvent.setup();
  render(<CacheExplorer />);
  await user.selectOptions(
    screen.getByLabelText('Organization'),
    '2-way: 2 sets × 2 ways',
  );
  for (let i = 0; i < 2; i++)
    await user.click(
      screen.getByRole('button', { name: 'Reveal without predicting' }),
    );
  // Blocks 0 and 4 fill set 0; block 0 is least recently used.
  expect(cell(0, 0)).toHaveTextContent('next victim');
  expect(cell(0, 1)).not.toHaveTextContent('next victim');
});
