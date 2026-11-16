import {
  useEffect,
  useRef,
  useState,
  type SubmitEvent,
  type KeyboardEvent,
} from 'react';
// The explorer runs the lesson's tested lab model, so the figure, the shown
// code and the tests cannot disagree.
import {
  BIAS,
  bitsOf,
  decode,
  exactDecimal,
  fromBits,
  nextUp,
  spacing,
  toggleBit,
} from '../../../labs/computer-architecture-execution/floating-point-representation/example';

export const PRESETS: { id: string; label: string; bits: number }[] = [
  { id: 'one', label: '1', bits: bitsOf(1) },
  { id: 'tenth', label: '0.1', bits: bitsOf(0.1) },
  { id: 'six', label: '6.5', bits: bitsOf(6.5) },
  { id: 'big', label: '16,777,216 (2²⁴)', bits: bitsOf(2 ** 24) },
  { id: 'negative-zero', label: '−0', bits: bitsOf(-0) },
  { id: 'tiny', label: 'Smallest subnormal', bits: 0x00000001 },
  { id: 'max', label: 'Largest finite value', bits: 0x7f7fffff },
  { id: 'infinity', label: 'Infinity', bits: 0x7f800000 },
  { id: 'nan', label: 'NaN', bits: 0x7fc00000 },
];

interface Challenge {
  prompt: string;
  start: number;
  result: number;
  options: { label: string; value: number | string }[];
  /** What the options are compared against, read from the result. */
  measure: (bits: number) => number | string;
  explain: string;
}

const one = bitsOf(1);
export const CHALLENGES: Challenge[] = [
  {
    prompt: 'Store 16,777,217 (2²⁴ + 1). Which value does binary32 keep?',
    start: bitsOf(2 ** 24),
    result: bitsOf(2 ** 24 + 1),
    options: [
      { label: '16,777,217', value: 2 ** 24 + 1 },
      { label: '16,777,216', value: 2 ** 24 },
      { label: '16,777,218', value: 2 ** 24 + 2 },
    ],
    measure: fromBits,
    explain:
      'Above 2²⁴ the gap between neighbors is 2, so 16,777,217 is exactly halfway. A tie goes to the neighbor whose last fraction bit is 0: 16,777,216.',
  },
  {
    prompt:
      'Start from 1 and flip bit 23, the lowest exponent bit. What value results?',
    start: one,
    result: toggleBit(one, 23),
    options: [
      { label: '0.5', value: 0.5 },
      { label: '2', value: 2 },
      { label: '1.00000012', value: 1 + 2 ** -23 },
    ],
    measure: fromBits,
    explain:
      'The stored exponent of 1 is 127, an odd number, so bit 23 is already 1. Flipping it gives 126: the scale drops from 2⁰ to 2⁻¹ and the value halves.',
  },
  {
    prompt:
      'Start from 1 and flip bit 0, the lowest fraction bit. How much does the value grow?',
    start: one,
    result: toggleBit(one, 0),
    options: [
      { label: '2⁻²³ ≈ 0.000000119', value: 2 ** -23 },
      { label: '2⁻²⁴ ≈ 0.000000060', value: 2 ** -24 },
      { label: 'Exactly 0.0000001', value: 1e-7 },
    ],
    measure: (bits) => fromBits(bits) - 1,
    explain:
      'The lowest fraction bit is worth 2⁻²³ of the significand, and the scale of 1 is 2⁰. That is the gap to the next value after 1; 0.0000001 is not a power of two.',
  },
  {
    prompt:
      'Set all eight exponent bits to 1 and every fraction bit to 0. What is stored?',
    start: 0x7f000000,
    result: 0x7f800000,
    options: [
      { label: 'The largest finite value', value: 'normal' },
      { label: 'Infinity', value: 'infinity' },
      { label: 'NaN', value: 'nan' },
    ],
    measure: (bits) => decode(bits).kind,
    explain:
      'An all-ones exponent is reserved. With a zero fraction it means infinity; with any other fraction it means NaN. The largest finite value has exponent 254.',
  },
];

const field = (position: number) =>
  position === 31 ? 'sign' : position >= 23 ? 'exponent' : 'fraction';
const show = (value: number) => (Object.is(value, -0) ? '-0' : String(value));
const kindText: Record<string, string> = {
  normal: 'Normal: ± 1.f × 2^(exponent − 127)',
  subnormal: 'Subnormal: ± 0.f × 2⁻¹²⁶ (exponent field 0)',
  zero: 'Zero: exponent and fraction fields are 0',
  infinity: 'Infinity: exponent field 255, fraction 0',
  nan: 'NaN: exponent field 255, fraction not 0',
};

function significand(bits: number): string | null {
  const { kind } = decode(bits);
  if (kind === 'infinity' || kind === 'nan') return null;
  const withOne = exactDecimal((bits & 0x7fffff) | (BIAS << 23));
  if (kind === 'normal') return withOne;
  return withOne === '1' ? '0' : `0${withOne.slice(1)}`;
}

function gapText(bits: number): string {
  const { kind, value } = decode(bits);
  if (kind === 'infinity' || kind === 'nan') return 'not defined';
  try {
    return show(spacing(value));
  } catch {
    return 'none: the next value is Infinity';
  }
}

export default function Float32Explorer() {
  const [bits, setBits] = useState(one);
  const [focus, setFocus] = useState(31);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(
    'Showing 1. Flip a bit, store a number or choose a preset.',
  );
  const [challenge, setChallenge] = useState(0);
  const [picked, setPicked] = useState<number | 'skip' | null>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const nextButton = useRef<HTMLButtonElement>(null);
  // After a prediction the option buttons lock, so move focus to Next.
  useEffect(() => {
    if (picked !== null) nextButton.current?.focus();
  }, [picked]);
  const fields = decode(bits);
  const pattern = bits.toString(2).padStart(32, '0');
  const sig = significand(bits);

  function flip(position: number) {
    const next = toggleBit(bits, position);
    const now = (next >>> position) & 1;
    setBits(next);
    setMessage(
      `Bit ${position} (${field(position)}) is now ${now}. The value changes from ${show(fromBits(bits))} to ${show(fromBits(next))}.`,
    );
  }
  function onBitKey(event: KeyboardEvent, position: number) {
    const moves: Record<string, number> = {
      ArrowLeft: Math.min(31, position + 1),
      ArrowRight: Math.max(0, position - 1),
      Home: 31,
      End: 0,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    setFocus(target);
    buttons.current[target]?.focus();
  }
  function store(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    const parsed = Number(trimmed);
    if (!trimmed || (Number.isNaN(parsed) && trimmed !== 'NaN')) {
      setError('Enter a decimal number, Infinity or NaN.');
      return;
    }
    setError('');
    const stored = bitsOf(parsed);
    setBits(stored);
    setMessage(
      `Stored the nearest binary32 value to ${trimmed}: ${exactDecimal(stored)}.`,
    );
  }
  function load(id: string) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setBits(preset.bits);
    setMessage(`Loaded ${preset.label}: ${exactDecimal(preset.bits)}.`);
  }
  const current = CHALLENGES[challenge]!;
  const answer = current.measure(current.result);
  function predict(choice: number | 'skip') {
    setPicked(choice);
    setBits(current.result);
    const verdict =
      choice === 'skip'
        ? ''
        : current.options[choice]!.value === answer
          ? ' Your prediction was correct.'
          : ' Not this time.';
    setMessage(`${current.explain}${verdict}`);
  }
  function nextChallenge() {
    const index = (challenge + 1) % CHALLENGES.length;
    setChallenge(index);
    setPicked(null);
    setBits(CHALLENGES[index]!.start);
    setMessage(`Challenge ${index + 1}: ${CHALLENGES[index]!.prompt}`);
  }
  function reset() {
    setBits(one);
    setText('');
    setError('');
    setChallenge(0);
    setPicked(null);
    setFocus(31);
    setMessage('Showing 1. Flip a bit, store a number or choose a preset.');
  }

  const groups = [
    { name: 'Sign', range: 'bit 31', from: 31, to: 31 },
    { name: 'Exponent', range: 'bits 30–23', from: 30, to: 23 },
    { name: 'Fraction', range: 'bits 22–0', from: 22, to: 0 },
  ];

  return (
    <section
      className="array-explorer float-explorer"
      aria-label="Interactive binary32 explorer"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Binary32 explorer</span>
          <h3>Flip a bit, read the value.</h3>
        </div>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · IEEE 754 binary32 · typed numbers are parsed as binary64,
        then rounded to the nearest binary32 value, ties to even
      </p>
      <div className="float-inputs">
        <form onSubmit={store}>
          <label>
            Store a number
            <input
              value={text}
              inputMode="decimal"
              placeholder="0.1"
              onChange={(e) => setText(e.target.value)}
              aria-describedby={error ? 'float-error' : undefined}
            />
          </label>
          <button type="submit" className="primary-control">
            Store
          </button>
        </form>
        <label>
          Load a preset
          <select value="" onChange={(e) => load(e.target.value)}>
            <option value="" disabled>
              Choose…
            </option>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p id="float-error" className="explorer-error" role="alert">
          {error}
        </p>
      )}
      <div
        className="float-bits"
        role="toolbar"
        aria-label="Binary32 bits, sign bit first. Arrow keys move between bits."
      >
        {groups.map((group) => (
          <div
            key={group.name}
            role="group"
            aria-label={`${group.name}, ${group.range}`}
            className={`bit-group ${group.name.toLowerCase()}`}
          >
            <span className="bit-group-name" aria-hidden="true">
              {group.name} · {group.range}
            </span>
            <span className="bit-row">
              {Array.from({ length: group.from - group.to + 1 }, (_, i) => {
                const position = group.from - i;
                const bit = pattern[31 - position]!;
                return (
                  <button
                    key={position}
                    ref={(node) => {
                      buttons.current[position] = node;
                    }}
                    type="button"
                    className="bit"
                    aria-pressed={bit === '1'}
                    aria-label={`Bit ${position}, ${field(position)}, ${bit}`}
                    tabIndex={position === focus ? 0 : -1}
                    onFocus={() => setFocus(position)}
                    onKeyDown={(e) => onBitKey(e, position)}
                    onClick={() => flip(position)}
                  >
                    {bit}
                  </button>
                );
              })}
            </span>
          </div>
        ))}
      </div>
      <dl className="float-readout">
        <div>
          <dt>Pattern</dt>
          <dd>
            <code>0x{bits.toString(16).padStart(8, '0')}</code>
          </dd>
        </div>
        <div className="wide">
          <dt>Fields</dt>
          <dd>
            sign {fields.sign} · exponent {fields.exponent}
            {fields.scale !== null && fields.kind === 'normal'
              ? ` (scale 2^(${fields.exponent} − ${BIAS}) = 2^${fields.scale})`
              : ''}{' '}
            · fraction {fields.fraction.toLocaleString('en')}
          </dd>
        </div>
        <div className="wide">
          <dt>Kind</dt>
          <dd>{kindText[fields.kind]}</dd>
        </div>
        {sig !== null && (
          <div>
            <dt>Significand</dt>
            <dd>
              <code>{sig}</code>
            </dd>
          </div>
        )}
        <div className="wide">
          <dt>Exact stored value</dt>
          <dd>
            <code>{exactDecimal(bits)}</code>
          </dd>
        </div>
        <div>
          <dt>As a JavaScript number</dt>
          <dd>
            <code>{show(fields.value)}</code>
          </dd>
        </div>
        <div>
          <dt>Gap to the next larger magnitude</dt>
          <dd>
            <code>{gapText(bits)}</code>
          </dd>
        </div>
        {fields.kind !== 'nan' && fields.value !== Infinity && (
          <div>
            <dt>Next value toward +∞</dt>
            <dd>
              <code>{show(fromBits(nextUp(bits)))}</code>
            </dd>
          </div>
        )}
      </dl>
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <p>{message}</p>
        </div>
      </div>
      <fieldset className="float-challenge">
        <legend>
          Predict first · challenge {challenge + 1} of {CHALLENGES.length}
        </legend>
        <p>{current.prompt}</p>
        <div className="prediction-controls">
          {current.options.map((option, index) => (
            <button
              key={option.label}
              type="button"
              className={picked === null ? 'primary-control' : undefined}
              aria-disabled={picked !== null}
              aria-pressed={picked === index}
              onClick={() => picked === null && predict(index)}
            >
              {option.label}
              {picked !== null && option.value === answer ? ' ✓ answer' : ''}
            </button>
          ))}
          {picked === null ? (
            <button type="button" onClick={() => predict('skip')}>
              Reveal without predicting
            </button>
          ) : (
            <button type="button" ref={nextButton} onClick={nextChallenge}>
              Next challenge
            </button>
          )}
        </div>
      </fieldset>
      <noscript>
        <p>
          The interactive controls need JavaScript. The figures in the lesson
          show the same fields, spacing and rounding as static diagrams.
        </p>
      </noscript>
    </section>
  );
}
