import { mesi, parseAccesses } from './models';
import { contracts } from './contracts';
contracts((accesses) =>
  mesi(parseAccesses(accesses)).map((s) => s.after.join('')),
);
