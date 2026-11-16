import { enterKernel, returnToUser } from './example';
import { contracts } from './contracts';
contracts(
  (pc, event) =>
    returnToUser(enterKernel({ mode: 'user', pc, resumePc: null }, event, 100))
      .pc,
);
