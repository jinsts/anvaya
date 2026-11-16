import { useState } from 'react';
// Runs the lesson's tested DMA receive-buffer model one event at a time.
import {
  advance,
  owner,
  type Event,
  type Request,
} from '../../../labs/computer-architecture-execution/io-mechanisms/example';

type Actor = 'driver' | 'device';
interface Action {
  id: string;
  label: string;
  actor: Actor;
  event: Event;
  short: string;
  note: string;
}
const ACTIONS: Action[] = [
  {
    id: 'submit',
    label: 'Driver submits',
    actor: 'driver',
    event: { type: 'submit' },
    short: 'submit descriptor',
    note: 'The driver publishes a descriptor with the buffer’s device address and size, then tells the device. From now on the device may write the buffer.',
  },
  {
    id: 'complete',
    label: 'Device completes 4 bytes',
    actor: 'device',
    event: { type: 'complete', bytes: 4 },
    short: 'DMA 4 bytes, post completion',
    note: 'The device writes 4 bytes into the buffer by DMA and posts a completion. The buffer stays reserved until the driver reclaims it.',
  },
  {
    id: 'fail',
    label: 'Device reports an error',
    actor: 'device',
    event: { type: 'fail' },
    short: 'post error',
    note: 'The device posts an error completion. The contents are unusable, and the buffer stays reserved until reclaimed.',
  },
  {
    id: 'reclaim',
    label: 'Driver reclaims',
    actor: 'driver',
    event: { type: 'reclaim' },
    short: 'sync mapping, reclaim',
    note: 'The driver processes the completion, performs any DMA synchronization and gives the buffer back to the host.',
  },
];
const START: Request = { phase: 'ready', capacity: 8, transferred: 0 };
type Outcome = 'host' | 'device' | 'refused';
interface Row {
  action: Action | null;
  refused: boolean;
  request: Request;
}

export default function DmaStepper() {
  const [rows, setRows] = useState<Row[]>([
    { action: null, refused: false, request: START },
  ]);
  const [prediction, setPrediction] = useState<Outcome | ''>('');
  const [score, setScore] = useState({ right: 0, asked: 0 });
  const [story, setStory] = useState(
    'An 8-byte receive buffer starts ready and owned by the host. Predict the owner after the event you choose, then choose it.',
  );
  const current = rows[rows.length - 1]!.request;

  function run(action: Action) {
    let next: Request | null = null;
    let message: string;
    try {
      next = advance(current, action.event);
      message = `${action.note} Owner: ${owner(next)}; phase: ${next.phase}.`;
    } catch (error) {
      message =
        action.id === 'reclaim' && current.phase === 'in-flight'
          ? 'Refused: the request is still in flight, so the device may still write the buffer. Giving up waiting, as after a timeout, does not make it safe to reuse.'
          : `Refused: ${(error as Error).message} The buffer is unchanged.`;
    }
    const result: Outcome = next ? owner(next) : 'refused';
    const asked = prediction !== '';
    const right = asked && prediction === result;
    setScore({
      right: score.right + (right ? 1 : 0),
      asked: score.asked + (asked ? 1 : 0),
    });
    setStory(
      `${message}${asked ? (right ? ' Your prediction was correct.' : ` You predicted ${prediction}.`) : ''}`,
    );
    setPrediction('');
    setRows([
      ...rows,
      { action, refused: next === null, request: next ?? current },
    ]);
  }
  function reset() {
    setRows([{ action: null, refused: false, request: START }]);
    setPrediction('');
    setScore({ right: 0, asked: 0 });
    setStory(
      'An 8-byte receive buffer starts ready and owned by the host. Predict the owner after the event you choose, then choose it.',
    );
  }

  return (
    <section
      className="array-explorer dma-stepper"
      aria-label="Interactive DMA ownership stepper"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">DMA stepper</span>
          <h3>Who may touch the buffer now?</h3>
        </div>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · one 8-byte receive buffer · you choose each event
      </p>
      <table className="dma-lanes">
        <caption className="sr-only">Events so far, one row per event</caption>
        <thead>
          <tr>
            <th scope="col">Driver (CPU)</th>
            <th scope="col">Device</th>
            <th scope="col">Buffer</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const o = owner(row.request);
            return (
              <tr
                key={i}
                className={`${row.refused ? 'refused' : ''}${i === rows.length - 1 ? ' latest' : ''}`}
              >
                {(['driver', 'device'] as Actor[]).map((lane) => (
                  <td
                    key={lane}
                    className={row.action?.actor === lane ? `acts ${lane}` : ''}
                  >
                    {row.action?.actor === lane
                      ? row.refused
                        ? `tries to ${row.action.id}: refused`
                        : row.action.short
                      : i === 0 && lane === 'driver'
                        ? 'start'
                        : ''}
                  </td>
                ))}
                <td>
                  <span className={`dma-owner o-${o}`}>{o}</span>{' '}
                  {row.request.phase}
                  {row.request.phase === 'completed' ||
                  (row.request.phase === 'ready' && row.request.transferred > 0)
                    ? ` · ${row.request.transferred} B`
                    : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <fieldset className="operation-controls">
        <legend>Predict the owner after your next event, then choose it</legend>
        <label>
          Predict: owner afterwards
          <select
            value={prediction}
            onChange={(e) => setPrediction(e.target.value as Outcome | '')}
          >
            <option value="">Predict…</option>
            <option value="host">host</option>
            <option value="device">device</option>
            <option value="refused">refused</option>
          </select>
        </label>
      </fieldset>
      <div className="dma-actions">
        {ACTIONS.map((action) => (
          <button key={action.id} type="button" onClick={() => run(action)}>
            {action.label}
          </button>
        ))}
      </div>
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <strong>
            {rows.length === 1
              ? 'Ready'
              : `Event ${rows.length - 1}${score.asked ? ` · predictions ${score.right} of ${score.asked}` : ''}`}
          </strong>
          <p>{story}</p>
        </div>
      </div>
      <noscript>
        <p>
          The stepper needs JavaScript. The text after it describes the same
          sequence.
        </p>
      </noscript>
    </section>
  );
}
