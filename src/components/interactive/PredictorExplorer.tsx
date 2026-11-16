import { useEffect, useMemo, useRef, useState } from 'react';
// Runs the lesson's tested predictor model on the same outcome streams.
import {
  STATE_NAMES,
  STREAMS,
  accuracy,
  predict,
  type PredictorKind,
} from '../../../labs/computer-architecture-execution/branch-prediction/predictor';

export default function PredictorExplorer() {
  const [streamId, setStreamId] = useState<string>('loop');
  const [kind, setKind] = useState<PredictorKind>('two-bit');
  const [position, setPosition] = useState(0);
  const [guesses, setGuesses] = useState<(boolean | null)[]>([]);
  const stepButton = useRef<HTMLButtonElement>(null);
  const stream = STREAMS.find((s) => s.id === streamId)!;
  const steps = useMemo(() => predict(stream.outcomes, kind), [stream, kind]);
  const next = steps[position];
  const last = steps[position - 1];
  const state = next ? next.state : last!.next;
  const names = STATE_NAMES[kind];
  const done = position >= steps.length;
  const correctSoFar = steps.slice(0, position).filter((s) => s.correct).length;
  const learnerRight = guesses.filter(
    (g, i) => g !== null && g === steps[i]!.correct,
  ).length;
  const learnerAsked = guesses.filter((g) => g !== null).length;
  useEffect(() => {
    if (position > 0) stepButton.current?.focus();
  }, [position]);

  function restart(nextStream = streamId, nextKind = kind) {
    setStreamId(nextStream);
    setKind(nextKind);
    setPosition(0);
    setGuesses([]);
  }
  function reveal(guess: boolean | null) {
    setGuesses([...guesses, guess]);
    setPosition(position + 1);
  }

  let story: string;
  if (!last)
    story = `The ${kind} predictor starts in "${names[steps[0]!.state]}". Before each branch, judge from its state and the pattern so far whether it will guess right.`;
  else {
    const guess = guesses[position - 1];
    story = `Branch ${position} was ${last.outcome ? 'taken' : 'not taken'}. The predictor said ${last.prediction ? 'taken' : 'not taken'}: ${last.correct ? 'correct' : 'mispredicted, so the pipeline would discard the wrong-path work'}. State ${last.state} → ${last.next}.${
      guess === null || guess === undefined
        ? ''
        : guess === last.correct
          ? ' Your call was right.'
          : ' Your call was not.'
    }`;
  }
  if (done)
    story += ` Accuracy ${Math.round(accuracy(steps) * 100)}% (${correctSoFar} of ${steps.length}).${learnerAsked ? ` Your calls: ${learnerRight} of ${learnerAsked}.` : ''}`;

  return (
    <section
      className="array-explorer predictor-explorer"
      aria-label="Interactive branch predictor"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Branch predictor</span>
          <h3>Will the predictor guess right?</h3>
        </div>
        <button type="button" onClick={() => restart('loop', 'two-bit')}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · one predictor entry for one branch · manual steps
      </p>
      <fieldset className="operation-controls">
        <legend>Choose a branch and a predictor</legend>
        <label>
          Branch outcomes
          <select
            value={streamId}
            onChange={(e) => restart(e.target.value, kind)}
          >
            {STREAMS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Predictor
          <select
            value={kind}
            onChange={(e) => restart(streamId, e.target.value as PredictorKind)}
          >
            <option value="two-bit">Two-bit saturating counter</option>
            <option value="one-bit">One-bit: repeat the last outcome</option>
          </select>
        </label>
      </fieldset>
      <ol className="predictor-states" aria-label="Predictor state">
        {names.map((name, i) => (
          <li
            key={name}
            className={i === state ? 'current' : ''}
            aria-current={i === state ? 'true' : undefined}
          >
            <strong>{i}</strong>
            <span>{name}</span>
          </li>
        ))}
      </ol>
      <ol className="outcome-strip" aria-label="Branch outcomes so far">
        {steps.map((s, i) => (
          <li
            key={i}
            className={
              i < position
                ? s.correct
                  ? 'right'
                  : 'wrong'
                : i === position
                  ? 'next'
                  : ''
            }
          >
            {i < position ? (
              <>
                <span>{s.outcome ? 'T' : 'N'}</span>
                <span>{s.correct ? '✓' : '✗'}</span>
              </>
            ) : (
              <span>{i === position ? '?' : ''}</span>
            )}
          </li>
        ))}
      </ol>
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <strong>
            {done
              ? 'All branches seen'
              : `Branch ${position + 1} of ${steps.length}: predictor says ${next!.prediction ? 'taken' : 'not taken'}`}
          </strong>
          <p>{story}</p>
        </div>
        <div className="prediction-controls">
          {!done ? (
            <>
              <button
                type="button"
                className="primary-control"
                onClick={() => reveal(true)}
              >
                It will be right
              </button>
              <button
                type="button"
                className="primary-control"
                onClick={() => reveal(false)}
              >
                It will mispredict
              </button>
              <button
                type="button"
                ref={stepButton}
                onClick={() => reveal(null)}
              >
                Just reveal
              </button>
            </>
          ) : (
            <button type="button" onClick={() => restart()}>
              Run again
            </button>
          )}
        </div>
      </div>
      <noscript>
        <p>
          The predictor needs JavaScript. The figure above gives each stream's
          accuracy.
        </p>
      </noscript>
    </section>
  );
}
