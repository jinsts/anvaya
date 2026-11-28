import { pollCompletions } from './notification';
import { contracts } from './contracts';
contracts((readyTimes, interval) => {
  const { checks, emptyChecks, delays } = pollCompletions(readyTimes, interval);
  return { checks, emptyChecks, delays };
});
