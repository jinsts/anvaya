import { lifetimeReport } from './trace';
import { contracts } from './contracts';
contracts((events) => lifetimeReport(events));
