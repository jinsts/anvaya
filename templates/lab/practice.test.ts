// The quality gate runs the same contracts against the reference model.
import { total } from './example';
import { contracts } from './contracts';
contracts((values) => total(values));
