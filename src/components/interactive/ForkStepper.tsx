import { useEffect, useRef, useState } from 'react';
// Steps through the lesson's tested process model running its launcher.
import {
  LAUNCHER,
  simulate,
  type Snapshot,
} from '../../../labs/operating-systems-runtime-internals/processes/process';

const { events, processes } = simulate(LAUNCHER);
const STATE: Record<Snapshot['state'], string> = {
  running: 'running',
  waiting: 'waiting in wait',
  paused: 'paused',
  zombie: 'zombie: exited, not reaped',
  reaped: 'reaped',
};

function Tree({ rows, parent }: { rows: Snapshot[]; parent: string | null }) {
  const children = rows.filter((row) => row.parent === parent);
  if (!children.length) return null;
  return (
    <ul className="fork-tree">
      {children.map((row) => (
        <li key={row.name}>
          <span className={`fork-node s-${row.state}`}>
            <strong>{row.name}</strong> <code>{row.image}</code>{' '}
            <span className="fork-state">{STATE[row.state]}</span>
          </span>
          <Tree rows={rows} parent={row.name} />
        </li>
      ))}
    </ul>
  );
}

export default function ForkStepper() {
  const [position, setPosition] = useState(0);
  const [prediction, setPrediction] = useState('');
  const [verdict, setVerdict] = useState('');
  const nextButton = useRef<HTMLButtonElement>(null);
  const last = events[position - 1];
  const rows: Snapshot[] = last
    ? last.after
    : [{ name: 'P1', parent: null, image: 'program', state: 'running' }];
  const done = position >= events.length;
  useEffect(() => {
    if (position > 0) nextButton.current?.focus();
  }, [position]);

  function step() {
    const event = events[position];
    if (!event) return;
    if (event.kind === 'adopt' && prediction)
      setVerdict(
        prediction === event.process
          ? ' Your prediction was correct.'
          : ` You predicted ${prediction}.`,
      );
    else setVerdict('');
    setPosition(position + 1);
  }
  function reset() {
    setPosition(0);
    setPrediction('');
    setVerdict('');
  }

  const adopted = rows.filter((row) => row.parent === 'init');
  let story = last
    ? `${last.text}.${last.kind === 'adopt' ? verdict : ''}`
    : 'P1 is about to run the launcher. Predict which process init will adopt, then step.';
  if (done) {
    const reapedByInit = processes
      .filter((p) => p.end === 'reaped by init')
      .map((p) => p.name);
    story += ` Every process is reaped: by its parent, or (${reapedByInit.join(', ')}) by init.`;
  }

  return (
    <section
      className="array-explorer fork-stepper"
      aria-label="Interactive process stepper"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Process stepper</span>
          <h3>Fork, exec, exit and wait, one event at a time.</h3>
        </div>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · the launcher program · one possible order · manual steps
      </p>
      <div className="fork-trees">
        <div>
          <p className="fork-root">Started by the shell</p>
          <Tree rows={rows} parent={null} />
        </div>
        {adopted.length > 0 && (
          <div>
            <p className="fork-root">Adopted by init</p>
            <Tree rows={rows} parent="init" />
          </div>
        )}
      </div>
      <ol className="fork-events" aria-label="Events">
        {events.map((event, index) => (
          <li
            key={index}
            className={
              index < position ? 'done' : index === position ? 'next' : ''
            }
            aria-current={index === position ? 'step' : undefined}
          >
            {index < position ? event.text : `${index + 1}`}
          </li>
        ))}
      </ol>
      {position === 0 && (
        <fieldset className="operation-controls">
          <legend>Before stepping</legend>
          <label>
            Predict: which process will init adopt?
            <select
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
            >
              <option value="">Predict…</option>
              {processes.slice(1).map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
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
              ? 'Launcher finished'
              : `Event ${position + 1} of ${events.length}`}
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
              Next event
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
          events, process by process.
        </p>
      </noscript>
    </section>
  );
}
