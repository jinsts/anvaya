import { readFileSync } from 'node:fs';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import AssemblyStepper from '../../src/components/interactive/AssemblyStepper';

const dir = 'labs/computer-architecture-execution/reading-assembly';
const listings = {
  sumO0: readFileSync(`${dir}/sum-O0.txt`, 'utf8'),
  sumO2: readFileSync(`${dir}/sum-O2.txt`, 'utf8'),
  scaleO2: readFileSync(`${dir}/scale-O2.txt`, 'utf8'),
};
const status = () => screen.getByRole('status');
const register = (name: string) =>
  within(screen.getByRole('table')).getByRole('rowheader', {
    name: new RegExp(`^${name}`),
  }).parentElement!;

it('steps the -O2 loop and asks for a prediction at each conditional jump', async () => {
  const user = userEvent.setup();
  render(<AssemblyStepper listings={listings} />);
  expect(status()).toHaveTextContent('Next: endbr64 · 0 of 23 executed');
  await user.click(screen.getByRole('button', { name: 'Step' }));
  await user.click(screen.getByRole('button', { name: 'Step' }));
  expect(screen.queryByRole('button', { name: 'Step' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Predict: it jumps' }));
  expect(status()).toHaveTextContent('falls through. Not this time.');
  for (let i = 0; i < 4; i++)
    await user.click(screen.getByRole('button', { name: 'Step' }));
  // After addl: eax holds the first element.
  expect(register('rax')).toHaveTextContent('3');
  expect(status()).toHaveTextContent('Changed: rax 0x0 → 0x3.');
});

it('shows the call pushing a return address and rbx being restored', async () => {
  const user = userEvent.setup();
  render(<AssemblyStepper listings={listings} />);
  await user.selectOptions(screen.getByLabelText('Program'), 'scale-o2');
  for (let i = 0; i < 4; i++)
    await user.click(screen.getByRole('button', { name: 'Step' }));
  const stack = screen.getByRole('list', { name: 'Stack, top first' });
  expect(stack).toHaveTextContent(
    'return address: scale_sum, at imull %ebx, %eax',
  );
  expect(status()).toHaveTextContent('a multiple of 16 as the ABI requires');
  await user.click(screen.getByRole('button', { name: 'Run to the end' }));
  expect(status()).toHaveTextContent('Returned 48 in eax');
  expect(register('rbx')).toHaveTextContent('0xb0b0');
  await user.click(screen.getByRole('button', { name: 'Run again' }));
  expect(status()).toHaveTextContent('0 of');
});
