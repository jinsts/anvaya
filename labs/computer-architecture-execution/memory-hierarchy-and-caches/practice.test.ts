import { traceCache } from './example';
const solve = (addresses: readonly number[]) =>
  traceCache(addresses, 16, 2).map((entry) => entry.result);
import { contracts } from './contracts';
contracts(solve);
