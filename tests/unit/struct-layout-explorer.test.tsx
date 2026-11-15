import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import StructLayoutExplorer from '../../src/components/interactive/StructLayoutExplorer';

const status = () => screen.getByRole('status');
const grid = () => screen.getByRole('img', { name: /^Bytes 0 to/ });

it('shows the declared layout with its padding', () => {
  render(<StructLayoutExplorer />);
  expect(screen.getByText(/sizeof = 24 bytes/)).toBeInTheDocument();
  expect(grid()).toHaveAccessibleName(
    'Bytes 0 to 23: tag at 0 to 0, ratio at 8 to 15, flag at 16 to 16, count at 20 to 23; padding at 1 to 7, at 17 to 19',
  );
  expect(
    screen.getByLabelText('C declaration in the current order'),
  ).toHaveTextContent('char tag; double ratio; char flag; int32_t count;');
});

it('moves a field, explains the change and resets', async () => {
  const user = userEvent.setup();
  render(<StructLayoutExplorer />);
  await user.click(screen.getByRole('button', { name: 'Move flag down' }));
  expect(status()).toHaveTextContent(
    'Moved flag down. Size 24 → 24 bytes; padding 10 → 10.',
  );
  expect(screen.getByRole('button', { name: 'Move flag down' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Move flag up' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(status()).toHaveTextContent('Declared order: 24 bytes with 10 bytes');
});

it('sorts by alignment to the 16-byte layout the ABI reports', async () => {
  const user = userEvent.setup();
  render(<StructLayoutExplorer />);
  await user.click(
    screen.getByRole('button', { name: 'Sort by alignment, largest first' }),
  );
  expect(status()).toHaveTextContent(
    'Largest alignment first: 16 bytes with 2 bytes of padding.',
  );
  expect(grid()).toHaveAccessibleName(
    'Bytes 0 to 15: ratio at 0 to 7, count at 8 to 11, tag at 12 to 12, flag at 13 to 13; padding at 14 to 15',
  );
});
