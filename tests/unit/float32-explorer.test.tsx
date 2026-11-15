import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import Float32Explorer from '../../src/components/interactive/Float32Explorer';

const status = () => screen.getByRole('status');
const readout = (term: string) =>
  screen.getByText(term, { selector: 'dt' }).nextElementSibling!;
const bit = (position: number) =>
  screen.getByRole('button', { name: new RegExp(`^Bit ${position},`) });

it('starts at 1 and flips an exponent bit to halve the value', async () => {
  const user = userEvent.setup();
  render(<Float32Explorer />);
  expect(readout('Exact stored value')).toHaveTextContent(/^1$/);
  expect(bit(23)).toHaveAttribute('aria-pressed', 'true');
  await user.click(bit(23));
  expect(status()).toHaveTextContent(
    'Bit 23 (exponent) is now 0. The value changes from 1 to 0.5.',
  );
  expect(readout('Exact stored value')).toHaveTextContent(/^0\.5$/);
  expect(bit(23)).toHaveAttribute('aria-pressed', 'false');
});

it('stores a typed number as its nearest binary32 value', async () => {
  const user = userEvent.setup();
  render(<Float32Explorer />);
  await user.type(screen.getByLabelText('Store a number'), '0.1');
  await user.click(screen.getByRole('button', { name: 'Store' }));
  expect(readout('Exact stored value')).toHaveTextContent(
    '0.100000001490116119384765625',
  );
  expect(readout('Pattern')).toHaveTextContent('0x3dcccccd');
  expect(readout('Fields')).toHaveTextContent('exponent 123');

  await user.clear(screen.getByLabelText('Store a number'));
  await user.type(screen.getByLabelText('Store a number'), 'ten');
  await user.click(screen.getByRole('button', { name: 'Store' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Enter a decimal number');
});

it('classifies presets at the edges of the exponent field', async () => {
  const user = userEvent.setup();
  render(<Float32Explorer />);
  const preset = screen.getByLabelText('Load a preset');
  await user.selectOptions(preset, 'Smallest subnormal');
  expect(readout('Kind')).toHaveTextContent('Subnormal');
  await user.selectOptions(preset, 'Largest finite value');
  expect(readout('Gap to the next larger magnitude')).toHaveTextContent(
    'none: the next value is Infinity',
  );
  await user.selectOptions(preset, 'NaN');
  expect(readout('Kind')).toHaveTextContent('NaN');
  expect(screen.queryByText('Next value toward +∞')).toBeNull();
});

it('moves between bits with arrow keys from a single tab stop', async () => {
  const user = userEvent.setup();
  render(<Float32Explorer />);
  const toolbar = screen.getByRole('toolbar');
  const tabbable = within(toolbar)
    .getAllByRole('button')
    .filter((b) => b.tabIndex === 0);
  expect(tabbable).toHaveLength(1);
  bit(31).focus();
  await user.keyboard('{ArrowRight}');
  expect(bit(30)).toHaveFocus();
  await user.keyboard('{End}');
  expect(bit(0)).toHaveFocus();
  await user.keyboard(' ');
  expect(status()).toHaveTextContent('Bit 0 (fraction) is now 1.');
});

it('asks for a prediction, reveals the model answer and moves on', async () => {
  const user = userEvent.setup();
  render(<Float32Explorer />);
  expect(screen.getByText(/Store 16,777,217/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '16,777,217' }));
  expect(status()).toHaveTextContent('A tie goes to the neighbor');
  expect(status()).toHaveTextContent('Not this time.');
  expect(
    screen.getByRole('button', { name: '16,777,216 ✓ answer' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next challenge' })).toHaveFocus();
  expect(readout('Exact stored value')).toHaveTextContent(/^16777216$/);

  await user.click(screen.getByRole('button', { name: 'Next challenge' }));
  await user.click(screen.getByRole('button', { name: '0.5' }));
  expect(status()).toHaveTextContent('Your prediction was correct.');

  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(readout('Exact stored value')).toHaveTextContent(/^1$/);
  expect(screen.getByText(/Store 16,777,217/)).toBeInTheDocument();
});
