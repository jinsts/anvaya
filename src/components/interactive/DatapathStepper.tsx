import { useEffect, useRef, useState } from 'react';
import DatapathDiagram from '../diagrams/DatapathDiagram';
// Runs the lesson's tested datapath model: the highlighted units and wires are
// the ones the model reports for each instruction.
import {
  BUMP,
  BUMP_START,
  assembly,
  runDatapath,
  type DatapathStep,
} from '../../../labs/computer-architecture-execution/how-computers-execute-programs/datapath';

const steps = runDatapath(BUMP, BUMP_START);
type Choice = DatapathStep['changed'] | 'nothing';
const CHOICES: { value: Choice; label: string }[] = [
  { value: 'register', label: 'A register' },
  { value: 'memory', label: 'Data memory' },
  { value: 'nothing', label: 'Only the PC' },
];

const why: Record<string, string> = {
  load: 'The decoder sends the address to the ALU, which passes it to data memory; the loaded value returns to R0. Memory still holds the same value.',
  addi: 'R0 and the constant 1 enter the ALU and the result is written back to R0. Data memory is not used at all.',
  store:
    'The ALU passes the address to data memory, and the value read from R0 is written there. No register changes.',
};

export default function DatapathStepper() {
  // shown = how many instructions have executed; revealed = whether the
  // current one has been executed after a prediction.
  const [shown, setShown] = useState(0);
  const [prediction, setPrediction] = useState<Choice | null>(null);
  const [score, setScore] = useState(0);
  const nextButton = useRef<HTMLButtonElement>(null);
  const revealed = prediction !== null;
  const done = shown === steps.length && !revealed;
  const current = steps[shown];
  const last = revealed ? current : steps[shown - 1];
  const state = revealed
    ? current!.after
    : (steps[shown - 1]?.after ?? BUMP_START);
  useEffect(() => {
    if (revealed) nextButton.current?.focus();
  }, [revealed]);

  function predict(choice: Choice) {
    if (!current) return;
    setPrediction(choice);
    if (choice === current.changed) setScore(score + 1);
  }
  function advance() {
    setShown(shown + 1);
    setPrediction(null);
  }
  function reset() {
    setShown(0);
    setPrediction(null);
    setScore(0);
  }

  let story: string;
  if (revealed && current) {
    const verdict =
      prediction === current.changed
        ? 'Your prediction was correct.'
        : `You predicted ${CHOICES.find((c) => c.value === prediction)!.label.toLowerCase()}; it was ${current.changed === 'register' ? 'a register' : 'data memory'}.`;
    story = `${assembly(current.instruction)}: ${why[current.instruction.op]} PC ${current.before.pc} → ${current.after.pc}. ${verdict}`;
  } else if (current)
    story = `Next: ${assembly(current.instruction)}. Besides the PC, which state will this instruction change?`;
  else
    story = `Done: memory[1000] went from 7 to 8 in three instructions, and only the store wrote memory. Predictions: ${score} of ${steps.length} correct.`;

  return (
    <section
      className="datapath-stepper"
      aria-label="Interactive datapath stepper"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Datapath stepper</span>
          <h3>Predict the state change, then run it.</h3>
        </div>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · one instruction per step · single-cycle teaching datapath
      </p>
      <div className="datapath-layout">
        <DatapathDiagram
          state={state}
          instruction={
            current ? assembly(current.instruction) : 'program finished'
          }
          units={revealed ? current!.units : []}
          wires={revealed ? current!.wires : []}
          stepKey={shown}
          title="Single-cycle datapath"
          description={
            revealed && current
              ? `${assembly(current.instruction)} uses ${current.units.join(', ')}.`
              : `PC ${state.pc}, R0 ${state.registers[0]}, memory[1000] ${state.memory[1000]}.`
          }
        />
        <div className="datapath-side">
          <ol className="datapath-program" aria-label="Program">
            {steps.map((step, i) => (
              <li
                key={i}
                aria-current={i === shown ? 'step' : undefined}
                className={
                  i < shown || (i === shown && revealed)
                    ? 'done'
                    : i === shown
                      ? 'next'
                      : ''
                }
              >
                <code>
                  {i}: {assembly(step.instruction)}
                </code>
              </li>
            ))}
          </ol>
          <table className="datapath-state">
            <caption>
              Architectural state{' '}
              {revealed || shown
                ? 'after the last step'
                : 'before the first step'}
            </caption>
            <tbody>
              <tr className={last && revealed ? 'changed' : ''}>
                <th scope="row">PC</th>
                <td>{state.pc}</td>
              </tr>
              <tr
                className={
                  revealed && current?.changed === 'register' ? 'changed' : ''
                }
              >
                <th scope="row">R0</th>
                <td>{state.registers[0]}</td>
              </tr>
              <tr
                className={
                  revealed && current?.changed === 'memory' ? 'changed' : ''
                }
              >
                <th scope="row">memory[1000]</th>
                <td>{state.memory[1000]}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <p>{story}</p>
        </div>
        <div className="prediction-controls">
          {current &&
            !revealed &&
            CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                className="primary-control"
                onClick={() => predict(choice.value)}
              >
                {choice.label}
              </button>
            ))}
          {revealed && (
            <button type="button" ref={nextButton} onClick={advance}>
              {shown + 1 < steps.length ? 'Next instruction' : 'Finish'}
            </button>
          )}
          {done && (
            <button type="button" onClick={reset}>
              Run again
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
