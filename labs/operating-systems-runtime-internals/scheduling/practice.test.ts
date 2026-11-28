// The quality gate runs the same contracts against the reference model.
import { solve } from './fair';
import { contracts } from './contracts';
contracts(solve);
