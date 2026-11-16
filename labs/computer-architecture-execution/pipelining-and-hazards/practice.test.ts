import { schedule } from './pipeline';
import { contracts } from './contracts';
contracts((instructions, forwarding) =>
  instructions.length === 0
    ? 0
    : schedule(instructions, { forwarding }).bubbles,
);
