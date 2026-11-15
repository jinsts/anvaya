import { useEffect, useMemo, useRef, useState } from 'react';
// Runs GCC's committed listings in the lesson's tested x86-64 subset model.
import {
  HARNESS_RETURN,
  STACK_TOP,
  codeAddress,
  int32Bytes,
  parseListing,
  run,
  type Flags,
  type Reg,
} from '../../../labs/computer-architecture-execution/reading-assembly/x86';

export interface AssemblyListings {
  sumO0: string;
  sumO2: string;
  scaleO2: string;
}
const ARRAY = 0x5000n;
const VALUES = [3, 5, 7, 9];
const SHOWN: Reg[] = ['rdi', 'rsi', 'rdx', 'rax', 'rbx', 'rsp'];
const NAMES32: Partial<Record<Reg, string>> = {
  rsi: 'esi',
  rdx: 'edx',
  rax: 'eax',
  rbx: 'ebx',
};

const hex = (n: bigint) => `0x${n.toString(16)}`;
const low32 = (n: bigint) => {
  const v = n & 0xffffffffn;
  return v >= 0x80000000n ? v - 0x100000000n : v;
};
const flagText = (f: boolean | null) => (f === null ? '—' : f ? '1' : '0');

export default function AssemblyStepper({
  listings,
}: {
  listings: AssemblyListings;
}) {
  const scenarios = useMemo(() => {
    const sumO0 = parseListing(listings.sumO0);
    const sumO2 = parseListing(listings.sumO2);
    const scaleO2 = parseListing(listings.scaleO2);
    const memory = [{ address: ARRAY, bytes: int32Bytes(VALUES) }];
    return [
      {
        id: 'sum-o2',
        label: 'sum_to(values, 4) at -O2',
        listings: [sumO2],
        result: run([sumO2], 'sum_to', { args: [ARRAY, 4n], memory }),
      },
      {
        id: 'sum-o0',
        label: 'sum_to(values, 4) at -O0',
        listings: [sumO0],
        result: run([sumO0], 'sum_to', { args: [ARRAY, 4n], memory }),
      },
      {
        id: 'scale-o2',
        label: 'scale_sum(values, 4, 2) at -O2: a call',
        listings: [scaleO2, sumO2],
        result: run([scaleO2, sumO2], 'scale_sum', {
          args: [ARRAY, 4n, 2n],
          memory,
        }),
      },
    ];
  }, [listings]);
  const [scenarioId, setScenarioId] = useState('sum-o2');
  const [position, setPosition] = useState(0);
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [score, setScore] = useState({ right: 0, asked: 0 });
  const stepButton = useRef<HTMLButtonElement>(null);
  const scenario = scenarios.find((s) => s.id === scenarioId)!;
  const { steps, initial } = scenario.result;
  const next = steps[position];
  const last = steps[position - 1];
  const registers = last?.registers ?? initial.registers;
  const flags: Flags = last?.flags ?? initial.flags;
  const stack = last?.stack ?? initial.stack;
  const nextIsBranch = next !== undefined && /^j(?!mp)/.test(next.text);
  const awaiting = nextIsBranch && prediction === null;
  useEffect(() => {
    if (prediction !== null) stepButton.current?.focus();
  }, [prediction]);

  function reset(id = scenarioId) {
    setScenarioId(id);
    setPosition(0);
    setPrediction(null);
    setScore({ right: 0, asked: 0 });
  }
  function predict(jumps: boolean) {
    setPrediction(jumps);
    setScore({
      right: score.right + (jumps === next!.taken ? 1 : 0),
      asked: score.asked + 1,
    });
    setPosition(position + 1);
  }
  function step() {
    setPrediction(null);
    setPosition(position + 1);
  }
  function runToEnd() {
    setPrediction(null);
    setPosition(steps.length);
  }

  // Explain the instruction that just executed.
  let story: string;
  if (!last)
    story = `values = {${VALUES.join(', ')}} at ${hex(ARRAY)}. The caller has put the arguments in registers. Step through, and predict each conditional jump.`;
  else {
    const before = steps[position - 2]?.registers ?? initial.registers;
    const changes = last.wrote
      .filter((r) => r !== 'rsp' || !/^(push|pop|call|ret)/.test(last.text))
      .map((r) => `${r} ${hex(before[r])} → ${hex(last.registers[r])}`);
    const parts = [`${last.text}`];
    if (/^(pushq|call)/.test(last.text))
      parts.push(
        `rsp moves down 8 bytes to ${hex(last.registers.rsp)} and the value is written there.`,
      );
    if (/^(popq|ret)/.test(last.text))
      parts.push(`The word at the old rsp is read and rsp moves up 8 bytes.`);
    if (changes.length) parts.push(`Changed: ${changes.join(', ')}.`);
    if (last.stored.length && !/^(pushq|call)/.test(last.text))
      parts.push(
        `Wrote memory at ${last.stored.map((s) => hex(s.address)).join(', ')}.`,
      );
    if (last.flagsChanged)
      parts.push(
        `Flags: ZF ${flagText(last.flags.ZF)}, SF ${flagText(last.flags.SF)}, CF ${flagText(last.flags.CF)}, OF ${flagText(last.flags.OF)}.`,
      );
    if (last.taken !== undefined) {
      parts.push(
        last.taken
          ? 'The condition holds, so it jumps.'
          : 'The condition fails, so execution falls through.',
      );
      if (prediction !== null)
        parts.push(
          prediction === last.taken
            ? 'Your prediction was correct.'
            : 'Not this time.',
        );
    }
    if (last.rspAtCall !== undefined)
      parts.push(
        `rsp before the call was ${hex(last.rspAtCall)}, a multiple of 16 as the ABI requires.`,
      );
    if (position === steps.length)
      parts.push(
        `Returned ${low32(scenario.result.result)} in eax after ${steps.length} instructions.${score.asked ? ` Jump predictions: ${score.right} of ${score.asked}.` : ''}`,
      );
    story = parts.join(' ');
  }

  const currentListing = next
    ? scenario.listings.find((l) => l.name === next.function)!
    : scenario.listings.find((l) => l.name === last!.function)!;
  const describe = (value: bigint | null) => {
    if (value === null) return 'reserved, not written';
    if (value === HARNESS_RETURN) return 'return address: the test harness';
    const code = codeAddress(scenario.listings, value);
    if (code) {
      const instruction = scenario.listings.find(
        (l) => l.name === code.function,
      )!.instructions[code.index]!;
      return `return address: ${code.function}, at ${instruction.text}`;
    }
    return hex(value);
  };

  return (
    <section
      className="array-explorer assembly-stepper"
      aria-label="Interactive assembly stepper"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Assembly stepper</span>
          <h3>Run the compiler's code one instruction at a time.</h3>
        </div>
        <button type="button" onClick={() => reset()}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model of GCC 15.2's listings · x86-64 System V · values at{' '}
        {hex(ARRAY)} · addresses are illustrative
      </p>
      <fieldset className="operation-controls">
        <legend>Choose a function</legend>
        <label>
          Program
          <select value={scenarioId} onChange={(e) => reset(e.target.value)}>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <div className="asm-layout">
        <ol
          className="asm-listing"
          aria-label={`${currentListing.name} listing`}
        >
          {currentListing.instructions.map((instruction) => {
            const labels = Object.entries(currentListing.labels)
              .filter(
                ([name, i]) =>
                  i === instruction.index && !/^\.LF[BE]/.test(name),
              )
              .map(([name]) => name);
            const isNext =
              next?.function === currentListing.name &&
              next.index === instruction.index;
            return (
              <li
                key={instruction.index}
                className={isNext ? 'next' : ''}
                aria-current={isNext ? 'step' : undefined}
              >
                {labels.map((l) => (
                  <span key={l} className="asm-label">
                    {l}:
                  </span>
                ))}
                <code>{instruction.text}</code>
              </li>
            );
          })}
        </ol>
        <div className="asm-state">
          <table className="asm-registers">
            <caption>
              Registers {last ? `after step ${position}` : 'at entry'}
            </caption>
            <tbody>
              {SHOWN.map((r) => (
                <tr
                  key={r}
                  className={last?.wrote.includes(r) ? 'changed' : ''}
                >
                  <th scope="row">
                    {r}
                    {NAMES32[r] && <span> / {NAMES32[r]}</span>}
                  </th>
                  <td>{hex(registers[r])}</td>
                  <td>
                    {r === 'rdi' || r === 'rsp'
                      ? ''
                      : String(low32(registers[r]))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="asm-flags" aria-label="Flags">
            {(['ZF', 'SF', 'CF', 'OF'] as const).map((f) => (
              <span
                key={f}
                className={last?.flagsChanged ? 'flag changed' : 'flag'}
              >
                {f} {flagText(flags[f])}
              </span>
            ))}
          </p>
          <ol className="asm-stack" aria-label="Stack, top first">
            {stack.map((word) => (
              <li
                key={String(word.address)}
                className={word.address === registers.rsp ? 'top' : ''}
              >
                <code>
                  rsp
                  {word.address === registers.rsp
                    ? ''
                    : `+${Number(word.address - registers.rsp)}`}
                </code>
                <span>{describe(word.value)}</span>
              </li>
            ))}
            <li className="caller">
              <code>{hex(STACK_TOP)}</code>
              <span>caller's frame</span>
            </li>
          </ol>
        </div>
      </div>
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <strong>
            {next ? `Next: ${next.text}` : 'Returned'} · {position} of{' '}
            {steps.length} executed
          </strong>
          <p>{story}</p>
        </div>
        <div className="prediction-controls">
          {awaiting ? (
            <>
              <button
                type="button"
                className="primary-control"
                onClick={() => predict(true)}
              >
                Predict: it jumps
              </button>
              <button
                type="button"
                className="primary-control"
                onClick={() => predict(false)}
              >
                Predict: it falls through
              </button>
            </>
          ) : next ? (
            <button
              type="button"
              ref={stepButton}
              className="primary-control"
              onClick={step}
            >
              Step
            </button>
          ) : (
            <button type="button" onClick={() => reset()}>
              Run again
            </button>
          )}
          {next && (
            <button type="button" onClick={runToEnd}>
              Run to the end
            </button>
          )}
        </div>
      </div>
      <noscript>
        <p>
          The stepper needs JavaScript. The annotated listing, the control-flow
          figure and the trace table show the same execution.
        </p>
      </noscript>
    </section>
  );
}
