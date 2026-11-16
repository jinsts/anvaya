import { diskAccess } from './devices';
import { contracts } from './contracts';
contracts(
  (averageSeekMs, rpm, transferMBps, bytes) =>
    diskAccess({ averageSeekMs, rpm, transferMBps }, bytes).totalMs,
);
