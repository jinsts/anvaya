import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import ByteExplorer from '../../src/components/interactive/ByteExplorer';

const status = () => screen.getByRole('status');
const readout = (term: string) =>
  screen.getByText(term, { selector: 'dt' }).nextElementSibling!;
const bit = (position: number) =>
  screen.getByRole('button', { name: new RegExp(`^Bit ${position},`) });

it('reads one pattern both ways and widens it', async () => {
  const user = userEvent.setup();
  render(<ByteExplorer />);
  expect(readout('Unsigned')).toHaveTextContent('255');
  expect(readout("Two's complement")).toHaveTextContent('−1');
  expect(readout('Sign-extended to 16 bits')).toHaveTextContent('0xffff');
  expect(readout('Zero-extended to 16 bits')).toHaveTextContent('0x00ff');
  await user.click(bit(7));
  expect(status()).toHaveTextContent(
    'Bit 7 is now 0. Unsigned 255 → 127; signed −1 → 127.',
  );
  expect(readout('Sign-extended to 16 bits')).toHaveTextContent('0x007f');
});

it('scores flag predictions against the model after adding', async () => {
  const user = userEvent.setup();
  render(<ByteExplorer />);
  // 255 + 1: carry, no overflow.
  await user.selectOptions(screen.getByLabelText('Carry?'), 'Yes');
  await user.selectOptions(screen.getByLabelText('Signed overflow?'), 'Yes');
  await user.click(screen.getByRole('button', { name: 'Add and reveal' }));
  expect(status()).toHaveTextContent('carry is set (correct)');
  expect(status()).toHaveTextContent('so no overflow (not this time)');
  expect(screen.getByText('Overflow no')).toBeInTheDocument();
});

it('rejects an operand outside a byte and resets', async () => {
  const user = userEvent.setup();
  render(<ByteExplorer />);
  const input = screen.getByLabelText('Second byte (0–255)');
  await user.clear(input);
  await user.type(input, '300');
  expect(screen.getByRole('alert')).toHaveTextContent('0 to 255');
  expect(screen.getByRole('button', { name: 'Add and reveal' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(input).toHaveValue('1');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('moves between bits with arrow keys', async () => {
  const user = userEvent.setup();
  render(<ByteExplorer />);
  bit(7).focus();
  await user.keyboard('{ArrowRight}{ArrowRight}');
  expect(bit(5)).toHaveFocus();
  await user.keyboard('{End}');
  expect(bit(0)).toHaveFocus();
});
