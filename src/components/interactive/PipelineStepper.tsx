import { useEffect, useMemo, useRef, useState } from 'react';
// Runs the lesson's tested five-stage pipeline model.
import {
  PROGRAMS,
  schedule,
  type Row,
} from '../../../labs/computer-architecture-execution/pipelining-and-hazards/pipeline';

const label = (cell: string | null) =>
  cell === null ? '' : cell === 'stall' ? 'wait' : cell;

/** What happens in one cycle, in words, from the schedule. */
function describe(rows: Row[], cycle: number): string {
  const parts: string[] = [];
  for (const row of rows) {
    const cell = row.cells[cycle - 1];
    const name = row.instruction.text;
    if (!cell) continue;
    if (cell === 'flushed')
      parts.push(
        `${name} is flushed: the branch was taken, so it was on the wrong path`,
      );
    else if (cell === 'stall') {
      const inId = row.cells.slice(0, cycle - 1).includes('ID');
      parts.push(
        inId && row.waitedFor
          ? `${name} waits in ID for ${row.waitedFor.register} from ${row.waitedFor.producer} (${row.waitedFor.via === 'forwarding' ? 'a load’s value only exists after MEM' : 'it must be written back first'})`
          : `${name} is held in ${inId ? 'ID' : 'IF'} behind the instruction ahead of it`,
      );
    } else if (
      cell === 'EX' &&
      row.instruction.kind === 'branch' &&
      row.instruction.taken
    )
      parts.push(
        `${name} resolves in EX: taken, so fetch restarts at the target next cycle`,
      );
    else parts.push(`${name} in ${cell}`);
  }
  return `Cycle ${cycle}: ${parts.join('; ')}.`;
}

export default function PipelineStepper() {
  const [programId, setProgramId] = useState('load-use');
  const [forwarding, setForwarding] = useState(true);
  const [prediction, setPrediction] = useState('');
  const [cycle, setCycle] = useState(0);
  const program = PROGRAMS.find((p) => p.id === programId)!;
  const result = useMemo(
    () => schedule(program.program, { forwarding }),
    [program, forwarding],
  );
  const done = cycle >= result.cycles;
  const grid = useRef<HTMLDivElement>(null);
  // Keep the newest column visible when the timeline scrolls sideways.
  useEffect(() => {
    grid.current
      ?.querySelector('th.now')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [cycle]);
  const lost = result.bubbles + result.flushed;

  function restart() {
    setCycle(0);
    setPrediction('');
  }
  let story: string;
  if (cycle === 0)
    story = `${result.completed} instructions, forwarding ${forwarding ? 'on' : 'off'}. Predict how many cycles are lost to bubbles and flushed instructions, then step.`;
  else story = describe(result.rows, cycle);
  if (done)
    story += ` Finished in ${result.cycles} cycles: ${result.bubbles} ${result.bubbles === 1 ? 'bubble' : 'bubbles'} and ${result.flushed} flushed, ${lost} lost in all.${
      prediction === ''
        ? ''
        : Number(prediction) === lost
          ? ' Your prediction was correct.'
          : ` You predicted ${prediction}.`
    }`;

  return (
    <section
      className="array-explorer pipeline-stepper"
      aria-label="Interactive pipeline stepper"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Pipeline stepper</span>
          <h3>Advance the clock one cycle at a time.</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setProgramId('load-use');
            setForwarding(true);
            restart();
          }}
        >
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · five in-order stages · branches predicted not taken,
        resolved in EX · manual steps
      </p>
      <fieldset className="operation-controls">
        <legend>Choose a program and the hardware</legend>
        <label>
          Program
          <select
            value={programId}
            onChange={(e) => {
              setProgramId(e.target.value);
              restart();
            }}
          >
            {PROGRAMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="pipeline-check">
          <input
            type="checkbox"
            checked={forwarding}
            onChange={(e) => {
              setForwarding(e.target.checked);
              restart();
            }}
          />
          Forwarding
        </label>
        <label>
          Your prediction: cycles lost
          <select
            value={prediction}
            disabled={cycle > 0}
            onChange={(e) => setPrediction(e.target.value)}
          >
            <option value="">Predict…</option>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <div
        className="table-scroll pipeline-grid"
        tabIndex={0}
        role="region"
        aria-label="Pipeline timeline"
      >
        <table>
          <thead>
            <tr>
              <th scope="col">Instruction</th>
              {Array.from({ length: result.cycles }, (_, c) => (
                <th
                  scope="col"
                  key={c}
                  className={c + 1 === cycle ? 'now' : ''}
                >
                  {c + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, r) => (
              <tr key={`${programId}-${forwarding}-${r}`}>
                <th scope="row">
                  <code>{row.instruction.text}</code>
                </th>
                {row.cells.map((cell, c) => {
                  const shown = c < cycle;
                  return (
                    <td
                      key={c}
                      className={[
                        'cell',
                        shown && cell ? `s-${cell.toLowerCase()}` : 'empty',
                        c + 1 === cycle ? 'now' : '',
                      ].join(' ')}
                    >
                      {shown ? label(cell) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <strong>
            {cycle === 0
              ? 'Before cycle 1'
              : `Cycle ${cycle} of ${result.cycles}`}
          </strong>
          <p>{story}</p>
        </div>
        <div className="prediction-controls">
          {!done ? (
            <>
              <button
                type="button"
                className="primary-control"
                onClick={() => setCycle(cycle + 1)}
              >
                Next cycle
              </button>
              <button type="button" onClick={() => setCycle(result.cycles)}>
                Run to the end
              </button>
            </>
          ) : (
            <button type="button" onClick={restart}>
              Run again
            </button>
          )}
        </div>
      </div>
      <noscript>
        <p>
          The stepper needs JavaScript. The tables above show the same
          timelines.
        </p>
      </noscript>
    </section>
  );
}
