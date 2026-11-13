import { read, simulateCache } from './example';
import { contracts } from './contracts';
const solve = (addresses: readonly number[], sets: number, ways: number) =>
  simulateCache(addresses.map(read), { lineBytes: 16, sets, ways }).map(
    (step) => (step.hit ? 'hit' : 'miss'),
  );
contracts(solve);
