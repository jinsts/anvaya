import { execute } from './example';
const solve = (initial: number) =>
  execute(
    [
      { op: 'set', value: initial },
      { op: 'add', value: 255 },
      { op: 'jnz', target: 1 },
      { op: 'halt' },
    ],
    600,
  ).length - 1;
import { contracts } from './contracts';
contracts(solve);
