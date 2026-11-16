import { mesi, type CoherenceOp } from './models';
import { contracts } from './contracts';
contracts((accesses) =>
  mesi(
    accesses
      .split(' ')
      .filter(Boolean)
      .map((a): CoherenceOp => ({
        core: a[0] === 'A' ? 0 : 1,
        op: a[1] === 'w' ? 'write' : 'read',
      })),
  ).map((s) => s.after.join('')),
);
