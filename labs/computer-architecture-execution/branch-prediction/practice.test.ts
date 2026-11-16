import { predict } from './predictor';
import { contracts } from './contracts';
contracts(
  (outcomes) => predict(outcomes, 'two-bit').filter((s) => !s.correct).length,
);
