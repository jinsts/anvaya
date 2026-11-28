// The quality gate runs the same contracts against the reference model.
import { estimate } from './switches';
import { contracts } from './contracts';
contracts(estimate);
