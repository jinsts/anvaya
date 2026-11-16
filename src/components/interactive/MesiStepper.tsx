import { useEffect, useRef, useState } from 'react';
// Runs the lesson's tested MESI model for one cache line and two cores.
import {
  MESI_SCRIPT,
  mesi,
  type CoherenceStep,
  type Mesi,
} from '../../../labs/computer-architecture-execution/multicore/models';

const steps = mesi(MESI_SCRIPT);
const NAMES: Record<Mesi, string> = {
  M: 'Modified: only copy, changed',
  E: 'Exclusive: only copy, clean',
  S: 'Shared: clean, others may hold it',
  I: 'Invalid: no usable copy',
};
const core = (c: number) => (c === 0 ? 'Core A' : 'Core B');
const EFFECT: Record<CoherenceStep['effect'], string> = {
  none: 'No other cache holds a valid copy.',
  invalidated: 'The other core invalidates its copy.',
  'downgraded to S': 'The other core’s copy drops to Shared.',
  'supplied data, invalidated':
    'The other core supplies its modified data and invalidates its copy.',
  'supplied data, downgraded to S':
    'The other core supplies its modified data and drops to Shared.',
};

export default function MesiStepper() {
  const [position, setPosition] = useState(0);
  const [prediction, setPrediction] = useState<{ a: Mesi | ''; b: Mesi | '' }>({
    a: '',
    b: '',
  });
  const [score, setScore] = useState({ right: 0, asked: 0 });
  const [verdict, setVerdict] = useState('');
  const nextButton = useRef<HTMLButtonElement>(null);
  const next = steps[position];
  const last = steps[position - 1];
  const state = last ? last.after : (['I', 'I'] as [Mesi, Mesi]);
  const done = position >= steps.length;
  useEffect(() => {
    if (position > 0) nextButton.current?.focus();
  }, [position]);

  function reveal() {
    if (!next) return;
    const asked = prediction.a !== '' && prediction.b !== '';
    const right =
      asked && prediction.a === next.after[0] && prediction.b === next.after[1];
    setScore({
      right: score.right + (right ? 1 : 0),
      asked: score.asked + (asked ? 1 : 0),
    });
    setVerdict(
      !asked
        ? ''
        : right
          ? ' Your prediction was correct.'
          : ` You predicted A ${prediction.a}, B ${prediction.b}.`,
    );
    setPrediction({ a: '', b: '' });
    setPosition(position + 1);
  }
  function reset() {
    setPosition(0);
    setPrediction({ a: '', b: '' });
    setScore({ right: 0, asked: 0 });
    setVerdict('');
  }

  let story: string;
  if (!last)
    story =
      'Both caches start without the line. Before each access, predict both copies’ states afterwards.';
  else {
    const what = `${core(last.core)} ${last.op}s.`;
    const how =
      last.message === 'none'
        ? last.op === 'write' && last.before[last.core] === 'E'
          ? ' It holds the only copy, so it writes without telling anyone: E → M.'
          : ' Its copy is usable as it is, so nothing is announced.'
        : last.message === 'read miss'
          ? ` It misses and announces a read. ${EFFECT[last.effect]}`
          : ` It needs the only copy, so it sends a request for ownership. ${EFFECT[last.effect]}`;
    story = `${what}${how} States: A ${last.after[0]}, B ${last.after[1]}.${verdict}`;
  }
  if (done)
    story += ` Ownership requests: ${steps.filter((s) => s.message === 'request for ownership').length} of ${steps.length} accesses.${score.asked ? ` Predictions: ${score.right} of ${score.asked}.` : ''}`;

  return (
    <section
      className="array-explorer mesi-stepper"
      aria-label="Interactive MESI stepper"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Coherence stepper</span>
          <h3>Follow one cache line between two cores.</h3>
        </div>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · MESI · one line, two private caches · manual steps
      </p>
      <div className="mesi-cores">
        {[0, 1].map((c) => (
          <div
            key={c}
            className={`mesi-core${last && last.core === c ? ' acted' : ''}`}
          >
            <span className="mesi-name">{core(c)}</span>
            <span
              className={`mesi-state s-${state[c]}`}
              key={`${position}-${state[c]}`}
              aria-hidden="true"
            >
              {state[c]}
            </span>
            <span className="mesi-desc">{NAMES[state[c]!]}</span>
          </div>
        ))}
      </div>
      {last && last.message !== 'none' && (
        <p className="mesi-bus" aria-hidden="true">
          {core(last.core)} → other cache: <strong>{last.message}</strong>
          {last.effect !== 'none' ? ` · ${last.effect}` : ''}
        </p>
      )}
      <ol className="mesi-script" aria-label="Accesses">
        {steps.map((s, i) => (
          <li
            key={i}
            className={i < position ? 'done' : i === position ? 'next' : ''}
            aria-current={i === position ? 'step' : undefined}
          >
            {core(s.core)} {s.op}
            {i < position ? ` → ${s.after.join('')}` : ''}
          </li>
        ))}
      </ol>
      {!done && (
        <fieldset className="operation-controls">
          <legend>
            Next: {core(next!.core)} {next!.op}s. Predict the states afterwards
          </legend>
          {(['a', 'b'] as const).map((key) => (
            <label key={key}>
              {key === 'a' ? 'Predict: Core A' : 'Predict: Core B'}
              <select
                value={prediction[key]}
                onChange={(e) =>
                  setPrediction({
                    ...prediction,
                    [key]: e.target.value as Mesi | '',
                  })
                }
              >
                <option value="">Predict…</option>
                {(['M', 'E', 'S', 'I'] as const).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>
      )}
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <strong>
            {done
              ? 'Script finished'
              : `Access ${position + 1} of ${steps.length}`}
          </strong>
          <p>{story}</p>
        </div>
        <div className="prediction-controls">
          {!done ? (
            <button
              type="button"
              ref={nextButton}
              className="primary-control"
              onClick={reveal}
            >
              Run this access
            </button>
          ) : (
            <button type="button" onClick={reset}>
              Run again
            </button>
          )}
        </div>
      </div>
      <noscript>
        <p>
          The stepper needs JavaScript. The table after it lists the same
          transitions.
        </p>
      </noscript>
    </section>
  );
}
