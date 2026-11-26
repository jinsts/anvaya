// The quality gate runs the same contracts against the reference model.
import { parseTrace, summarize } from './trace';
import { contracts } from './contracts';
contracts((trace) => summarize(parseTrace(trace)));
