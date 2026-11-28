// The quality gate runs the same contracts against the reference model.
import { simulate } from './process';
import { contracts } from './contracts';
contracts((program) => simulate(program).processes);
