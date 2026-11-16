import { useRef, useState, type KeyboardEvent } from 'react';
// Runs the lesson's tested integer model.
import {
  addBytes,
  extendByte,
  signedByte,
} from '../../../labs/computer-architecture-execution/binary-and-data-representation/example';

const hex = (n: number, digits = 2) =>
  `0x${n.toString(16).padStart(digits, '0')}`;
const minus = (v: number) => (v < 0 ? `−${-v}` : String(v));
type YesNo = 'yes' | 'no';

export default function ByteExplorer() {
  const [raw, setRaw] = useState(0b11111111);
  const [other, setOther] = useState('1');
  const [focus, setFocus] = useState(7);
  const [prediction, setPrediction] = useState<{
    carry: YesNo | '';
    overflow: YesNo | '';
  }>({ carry: '', overflow: '' });
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState(
    'Showing 11111111. Flip a bit, then predict the flags for an addition.',
  );
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const operand = Number(other);
  const validOperand =
    other.trim() !== '' &&
    Number.isInteger(operand) &&
    operand >= 0 &&
    operand <= 255;
  const result = validOperand ? addBytes(raw, operand) : null;

  function flip(position: number) {
    const next = raw ^ (1 << position);
    setRaw(next);
    setRevealed(false);
    setMessage(
      `Bit ${position} is now ${(next >> position) & 1}. Unsigned ${raw} → ${next}; signed ${minus(signedByte(raw))} → ${minus(signedByte(next))}.${
        position === 7
          ? ' Bit 7 weighs +128 unsigned but −128 signed, so the two readings now differ by ' +
            (next >= 128 ? '256.' : '0.')
          : ''
      }`,
    );
  }
  function onBitKey(event: KeyboardEvent, position: number) {
    const moves: Record<string, number> = {
      ArrowLeft: Math.min(7, position + 1),
      ArrowRight: Math.max(0, position - 1),
      Home: 7,
      End: 0,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    setFocus(target);
    buttons.current[target]?.focus();
  }
  function reveal() {
    if (!result) return;
    setRevealed(true);
    const score = (guess: YesNo | '', actual: boolean) =>
      guess === ''
        ? 'no prediction'
        : (guess === 'yes') === actual
          ? 'correct'
          : 'not this time';
    setMessage(
      `${raw} + ${operand}: the unsigned sum ${raw + operand} ${
        result.carry
          ? 'needs a ninth bit, so carry is set'
          : 'fits in 8 bits, so no carry'
      } (${score(prediction.carry, result.carry)}). The signed sum ${minus(signedByte(raw))} + ${minus(
        signedByte(operand),
      )} = ${minus(signedByte(raw) + signedByte(operand))} ${
        result.signedOverflow
          ? 'is outside −128 to 127, so signed overflow is set'
          : 'fits in −128 to 127, so no overflow'
      } (${score(prediction.overflow, result.signedOverflow)}). The byte kept is ${result.unsigned
        .toString(2)
        .padStart(8, '0')}.`,
    );
  }
  function reset() {
    setRaw(0b11111111);
    setOther('1');
    setPrediction({ carry: '', overflow: '' });
    setRevealed(false);
    setFocus(7);
    setMessage(
      'Showing 11111111. Flip a bit, then predict the flags for an addition.',
    );
  }

  const pattern = raw.toString(2).padStart(8, '0');
  return (
    <section
      className="array-explorer byte-explorer"
      aria-label="Interactive byte explorer"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Byte explorer</span>
          <h3>One pattern, two readings.</h3>
        </div>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · 8-bit modular addition · two's complement · manual steps
      </p>
      <div
        className="byte-bits"
        role="toolbar"
        aria-label="Bits 7 to 0. Arrow keys move between bits."
      >
        {Array.from({ length: 8 }, (_, i) => {
          const position = 7 - i;
          const bit = pattern[i]!;
          return (
            <span key={position} className="byte-bit">
              <button
                ref={(node) => {
                  buttons.current[position] = node;
                }}
                type="button"
                className="bit"
                aria-pressed={bit === '1'}
                aria-label={`Bit ${position}, ${bit}`}
                tabIndex={position === focus ? 0 : -1}
                onFocus={() => setFocus(position)}
                onKeyDown={(e) => onBitKey(e, position)}
                onClick={() => flip(position)}
              >
                {bit}
              </button>
              <span className="weight" aria-hidden="true">
                {position === 7 ? '±128' : 2 ** position}
              </span>
            </span>
          );
        })}
      </div>
      <dl className="float-readout byte-readout">
        <div>
          <dt>Unsigned</dt>
          <dd>{raw}</dd>
        </div>
        <div>
          <dt>Two's complement</dt>
          <dd>{minus(signedByte(raw))}</dd>
        </div>
        <div>
          <dt>Hex</dt>
          <dd>
            <code>{hex(raw)}</code>
          </dd>
        </div>
        <div>
          <dt>Sign-extended to 16 bits</dt>
          <dd>
            <code>{hex(extendByte(raw, 'sign'), 4)}</code>
          </dd>
        </div>
        <div>
          <dt>Zero-extended to 16 bits</dt>
          <dd>
            <code>{hex(extendByte(raw, 'zero'), 4)}</code>
          </dd>
        </div>
      </dl>
      <fieldset className="float-challenge byte-add">
        <legend>Predict, then add</legend>
        <div className="byte-add-row">
          <label>
            Second byte (0–255)
            <input
              value={other}
              inputMode="numeric"
              onChange={(e) => {
                setOther(e.target.value);
                setRevealed(false);
              }}
              aria-invalid={!validOperand}
              aria-describedby={validOperand ? undefined : 'byte-error'}
            />
          </label>
          <label>
            Carry?
            <select
              value={prediction.carry}
              onChange={(e) => {
                setPrediction({
                  ...prediction,
                  carry: e.target.value as YesNo | '',
                });
                setRevealed(false);
              }}
            >
              <option value="">Predict…</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            Signed overflow?
            <select
              value={prediction.overflow}
              onChange={(e) => {
                setPrediction({
                  ...prediction,
                  overflow: e.target.value as YesNo | '',
                });
                setRevealed(false);
              }}
            >
              <option value="">Predict…</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
        {!validOperand && (
          <p id="byte-error" className="explorer-error" role="alert">
            Enter a whole number from 0 to 255.
          </p>
        )}
        <div className="prediction-controls">
          <button
            type="button"
            className="primary-control"
            onClick={reveal}
            disabled={!validOperand}
          >
            Add and reveal
          </button>
        </div>
        {revealed && result && (
          <p className="byte-flags">
            <span className={result.carry ? 'flag on' : 'flag'}>
              Carry {result.carry ? 'yes' : 'no'}
            </span>
            <span className={result.signedOverflow ? 'flag on' : 'flag'}>
              Overflow {result.signedOverflow ? 'yes' : 'no'}
            </span>
            <code>
              → {result.unsigned.toString(2).padStart(8, '0')} ={' '}
              {result.unsigned} unsigned, {minus(result.signed)} signed
            </code>
          </p>
        )}
      </fieldset>
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <p>{message}</p>
        </div>
      </div>
      <noscript>
        <p>
          The controls need JavaScript. The wheel and the carry/overflow grid
          show the same readings and flags.
        </p>
      </noscript>
    </section>
  );
}
