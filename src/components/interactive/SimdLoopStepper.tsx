import { useState } from 'react';
// Runs the lesson's tested vector plan and lane-wise addition.
import {
  addByGroups,
  vectorPlan,
} from '../../../labs/computer-architecture-execution/simd/lanes';

const LANE_OPTIONS = [4, 8] as const;

export default function SimdLoopStepper() {
  const [n, setN] = useState(10);
  const [lanes, setLanes] = useState<4 | 8>(4);
  const [step, setStep] = useState(0);
  const [guess, setGuess] = useState({ vector: '', remainder: '' });
  const plan = vectorPlan(n, lanes);
  const a = Array.from({ length: n }, (_, i) => i);
  const b = a.map((i) => 100 * i);
  const out = addByGroups(a, b, lanes);
  const done = step >= plan.groups.length;
  const current = plan.groups[step - 1];
  const finished = new Set(
    plan.groups
      .slice(0, step)
      .flatMap((g) => Array.from({ length: g.count }, (_, k) => g.first + k)),
  );

  function restart(nextN = n, nextLanes = lanes) {
    setN(nextN);
    setLanes(nextLanes);
    setStep(0);
    setGuess({ vector: '', remainder: '' });
  }
  let story: string;
  if (step === 0)
    story = `${n} elements, ${lanes} lanes (${lanes * 4}-byte vectors). Predict the vector iterations and the remainder, then run the loop.`;
  else
    story =
      current!.kind === 'vector'
        ? `Vector iteration: one instruction adds elements ${current!.first}–${current!.first + current!.count - 1}, all ${lanes} lanes at once.`
        : `Remainder: fewer than ${lanes} elements are left, so element ${current!.first} is added on its own.`;
  if (done && n > 0) {
    const right =
      guess.vector !== '' && guess.remainder !== ''
        ? Number(guess.vector) === plan.vectorIterations &&
          Number(guess.remainder) === plan.remainder
          ? ' Your prediction was correct.'
          : ' Not this time.'
        : '';
    story += ` Done: ${plan.vectorIterations} vector ${plan.vectorIterations === 1 ? 'iteration' : 'iterations'} and ${plan.remainder} remainder, ${plan.loopIterations} loop iterations instead of ${n}.${right}`;
  }

  return (
    <section
      className="array-explorer simd-stepper"
      aria-label="Interactive vector loop stepper"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Vector loop</span>
          <h3>How many iterations does the vector loop need?</h3>
        </div>
        <button type="button" onClick={() => restart(10, 4)}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · out[i] = a[i] + b[i] on 32-bit ints · manual steps
      </p>
      <fieldset className="operation-controls">
        <legend>Choose the array length and vector width</legend>
        <label>
          Elements
          <input
            type="number"
            min={0}
            max={20}
            value={n}
            onChange={(e) => {
              const value = Math.max(
                0,
                Math.min(20, Math.trunc(Number(e.target.value) || 0)),
              );
              restart(value, lanes);
            }}
          />
        </label>
        <label>
          Lanes
          <select
            value={lanes}
            onChange={(e) => restart(n, Number(e.target.value) as 4 | 8)}
          >
            {LANE_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l} ({l * 4}-byte vectors)
              </option>
            ))}
          </select>
        </label>
        <label>
          Predict: vector iterations
          <select
            value={guess.vector}
            disabled={step > 0}
            onChange={(e) => setGuess({ ...guess, vector: e.target.value })}
          >
            <option value="">Predict…</option>
            {Array.from({ length: 6 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
        <label>
          Predict: remainder
          <select
            value={guess.remainder}
            disabled={step > 0}
            onChange={(e) => setGuess({ ...guess, remainder: e.target.value })}
          >
            <option value="">Predict…</option>
            {Array.from({ length: 8 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <ol className="simd-elements" aria-label="Elements of out">
        {out.map((value, i) => {
          const group = plan.groups.find(
            (g) => i >= g.first && i < g.first + g.count,
          )!;
          const active =
            current && i >= current.first && i < current.first + current.count;
          return (
            <li
              key={i}
              className={[
                group.kind,
                finished.has(i) ? 'done' : '',
                active ? 'active' : '',
              ].join(' ')}
            >
              <span className="index">{i}</span>
              <span className="value">{finished.has(i) ? value : '—'}</span>
            </li>
          );
        })}
      </ol>
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <strong>
            {done
              ? 'Loop finished'
              : `Iteration ${step + 1} of ${plan.groups.length}`}
          </strong>
          <p>{story}</p>
        </div>
        <div className="prediction-controls">
          {!done ? (
            <button
              type="button"
              className="primary-control"
              onClick={() => setStep(step + 1)}
            >
              Next iteration
            </button>
          ) : (
            <button type="button" onClick={() => setStep(0)}>
              Run again
            </button>
          )}
        </div>
      </div>
      <noscript>
        <p>
          The stepper needs JavaScript. The lanes figure above shows the same
          split for ten elements.
        </p>
      </noscript>
    </section>
  );
}
