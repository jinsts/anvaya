import { useEffect, useRef, useState } from 'react';
// Steps through the decisions the lesson's tested fair-scheduler model makes
// for its running example, asking for a prediction before each one.
import {
  EXAMPLE,
  simulate,
} from '../../../labs/operating-systems-runtime-internals/scheduling/fair';

const { tasks, quantum, duration } = EXAMPLE;
const { decisions, timeline } = simulate(tasks, quantum, duration);
const ms = (ns: number) => (ns / 1e6).toFixed(2);

export default function SchedStepper() {
  const [position, setPosition] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [verdict, setVerdict] = useState('');
  const nextButton = useRef<HTMLButtonElement>(null);
  const done = position >= decisions.length;
  const current = decisions[position];
  const shown = decisions[position - 1];
  useEffect(() => {
    if (position > 0) nextButton.current?.focus();
  }, [position]);

  function step() {
    if (!current) return;
    setVerdict(
      prediction
        ? prediction === current.picked
          ? 'Your prediction was correct.'
          : `You predicted ${prediction}.`
        : '',
    );
    setPrediction('');
    setPosition(position + 1);
  }
  function reset() {
    setPosition(0);
    setPrediction('');
    setVerdict('');
  }

  const until = current ? current.time : duration;
  const widest = Math.max(
    1,
    ...(shown?.candidates.map((c) => c.vruntime) ?? [1]),
  );
  const story = shown
    ? `At ${shown.time} ms (${shown.reason}${shown.woke.length ? `; ${shown.woke.join(', ')} woke` : ''}), ${shown.picked} has the lowest virtual runtime${shown.candidates.length > 1 && shown.candidates[0]!.vruntime === shown.candidates[1]!.vruntime ? ' (tied: it ran longest ago)' : ''} and runs. ${verdict}`
    : `A is busy at nice 0, B is busy at nice 5, and C, at nice 0, runs 1 ms and then sleeps 3. Slices are ${quantum} ms. Predict who runs first, then step.`;

  return (
    <section
      className="array-explorer sched-stepper"
      aria-label="Interactive scheduler stepper"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Scheduler stepper</span>
          <h3>Pick the lowest virtual runtime, one decision at a time.</h3>
        </div>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · one CPU · {quantum} ms slices · manual steps
      </p>
      <div className="sched-strip" aria-hidden="true">
        {timeline.map((name, time) => (
          <span key={time} className={time < until ? `ran t-${name}` : 'later'}>
            {time < until ? name : ''}
          </span>
        ))}
      </div>
      {shown && (
        <ul className="sched-candidates" aria-label="Runnable tasks">
          {shown.candidates.map((c) => (
            <li
              key={c.name}
              className={c.name === shown.picked ? 'picked' : ''}
            >
              <strong>{c.name}</strong>
              <span className="sched-track">
                <span
                  className={`sched-bar t-${c.name}`}
                  style={{ width: `${(c.vruntime / widest) * 100}%` }}
                />
              </span>
              <span className="sched-value">
                {ms(c.vruntime)} ms
                {c.name === shown.picked ? ' · runs' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!done && (
        <fieldset className="operation-controls">
          <legend>Decision at {current!.time} ms</legend>
          <label>
            Predict: who runs next?
            <select
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
            >
              <option value="">Predict…</option>
              {tasks.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      )}
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <strong>
            {done
              ? `All ${decisions.length} decisions made`
              : `Decision ${position + 1} of ${decisions.length}`}
          </strong>
          <p>{story}</p>
        </div>
        <div className="prediction-controls">
          {!done ? (
            <button
              type="button"
              ref={nextButton}
              className="primary-control"
              onClick={step}
            >
              Next decision
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
          decisions.
        </p>
      </noscript>
    </section>
  );
}
