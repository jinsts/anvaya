import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import CallStackStepper from '../../src/components/interactive/CallStackStepper';

const status = () => screen.getByRole('status');
const picture = () => screen.getByRole('img');

it('steps through the story, asking both lifetime questions in turn', async () => {
  const user = userEvent.setup();
  render(<CallStackStepper />);
  expect(picture()).toHaveAccessibleName(/Stack, newest first: empty/);
  for (let i = 0; i < 3; i++)
    await user.click(screen.getByRole('button', { name: 'Next event' }));
  expect(picture()).toHaveAccessibleName(
    /makeBuffer with buf → object 1; main with data empty\. Heap: object 1, 128 bytes, allocated/,
  );
  await user.click(
    screen.getByRole('button', { name: 'It is freed with the frame' }),
  );
  expect(status()).toHaveTextContent('Not this time.');
  expect(picture()).toHaveAccessibleName(/main with data → object 1\./);
  await user.click(
    screen.getByRole('button', { name: 'The same handle, now dangling' }),
  );
  expect(status()).toHaveTextContent('Your prediction was correct.');
  expect(picture()).toHaveAccessibleName(/object 1, 128 bytes, freed/);
  expect(screen.getByText('dangling')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Next event' }));
  await user.click(screen.getByRole('button', { name: 'Next event' }));
  expect(status()).toHaveTextContent('Predictions: 1 of 2 correct.');
  await user.click(screen.getByRole('button', { name: 'Run again' }));
  expect(picture()).toHaveAccessibleName(/Stack, newest first: empty/);
});
