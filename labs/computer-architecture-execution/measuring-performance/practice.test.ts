import { summarize } from './stats';
import { contracts } from './contracts';
contracts((values) => {
  const { median, p90 } = summarize(values);
  return { median, p90 };
});
