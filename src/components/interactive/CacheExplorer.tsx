import { useMemo, useState } from 'react';
// The explorer runs the lesson's tested lab model, so the displayed code, its
// tests and this widget cannot disagree.
import {
  fieldBits,
  read,
  simulateCache,
  summarize,
  write,
  type Access,
  type Line,
  type Step,
  type WritePolicy,
} from '../../../labs/computer-architecture-execution/cache-organization/example';

const LINE_BYTES = 16;
const ADDRESS_BITS = 8;
export const ORGANIZATIONS = [
  { id: 'direct', label: 'Direct-mapped: 4 sets × 1 way', sets: 4, ways: 1 },
  { id: 'two-way', label: '2-way: 2 sets × 2 ways', sets: 2, ways: 2 },
  { id: 'full', label: 'Fully associative: 1 set × 4 ways', sets: 1, ways: 4 },
] as const;
export const STREAMS: { id: string; label: string; accesses: Access[] }[] = [
  {
    id: 'collide',
    label: 'Three blocks that collide',
    accesses: [0, 64, 0, 64, 128, 0].map(read),
  },
  {
    id: 'loop',
    label: 'A loop one line too large',
    accesses: [0, 16, 32, 48, 64, 0, 16, 32].map(read),
  },
  {
    id: 'stores',
    label: 'Stores to one line',
    accesses: [read(0), write(0), write(4), write(8), read(64), read(128)],
  },
];
type Prediction = 'hit' | 'miss' | null;

const verb = (access: Access) => (access.kind === 'read' ? 'Read' : 'Write');
const missReason: Record<NonNullable<Step['miss']>, string> = {
  compulsory: 'this block has never been in the cache',
  conflict:
    'a fully associative cache of the same size would still hold it; this set ran out of ways',
  capacity:
    'even a fully associative cache of the same size would have evicted it',
};

function explain(step: Step, policy: WritePolicy): string {
  const where = `${verb(step.access)} ${step.access.address}: block ${step.block} → set ${step.set}, tag ${step.tag}.`;
  const outcome = step.hit
    ? `Hit in way ${step.way}.`
    : `Miss (${step.miss}): ${missReason[step.miss!]}. Filled way ${step.way}.`;
  const victim = step.evicted
    ? ` Evicted block ${step.evicted.block}${step.evicted.dirty ? ', which was dirty, so it is written back to the next level' : ''}.`
    : '';
  const store =
    step.access.kind === 'write'
      ? policy === 'write-back'
        ? ' The line is now dirty; nothing is sent to the next level yet.'
        : ' The store is also sent to the next level.'
      : '';
  return `${where} ${outcome}${victim}${store}`;
}

export default function CacheExplorer() {
  const [organization, setOrganization] = useState('direct');
  const [streamId, setStreamId] = useState('collide');
  const [policy, setPolicy] = useState<WritePolicy>('write-back');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const geometry = ORGANIZATIONS.find((o) => o.id === organization)!;
  const stream = STREAMS.find((s) => s.id === streamId)!;
  const steps = useMemo(
    () =>
      simulateCache(stream.accesses, {
        lineBytes: LINE_BYTES,
        sets: geometry.sets,
        ways: geometry.ways,
        write: policy,
      }),
    [stream, geometry, policy],
  );
  const position = predictions.length;
  const shown = position > 0 ? steps[position - 1] : undefined;
  const next = steps[position];
  const lines: (Line | null)[][] =
    shown?.lines ??
    Array.from({ length: geometry.sets }, () =>
      Array<Line | null>(geometry.ways).fill(null),
    );
  const bits = fieldBits({ lineBytes: LINE_BYTES, ...geometry });
  const tagBits = ADDRESS_BITS - bits.set - bits.offset;
  const correct = predictions.filter(
    (p, i) => p !== null && (p === 'hit') === steps[i]!.hit,
  ).length;
  const predicted = predictions.filter((p) => p !== null).length;

  function restart() {
    setPredictions([]);
  }
  function reveal(prediction: Prediction) {
    if (next) setPredictions([...predictions, prediction]);
  }
  function reset() {
    setOrganization('direct');
    setStreamId('collide');
    setPolicy('write-back');
    restart();
  }

  let story: string;
  if (!shown)
    story = `Next: ${verb(next!.access).toLowerCase()} address ${next!.access.address}. Find its set, check that set's lines, then predict.`;
  else {
    const last = predictions[position - 1];
    const verdict =
      last === null
        ? ''
        : ` You predicted ${last}: ${(last === 'hit') === shown.hit ? 'correct' : 'not this time'}.`;
    story = explain(shown, policy) + verdict;
  }
  const total = summarize(steps);

  const binary = next?.access.address.toString(2).padStart(ADDRESS_BITS, '0');
  const fields = next
    ? [
        { label: 'tag', bits: binary!.slice(0, tagBits), value: next.tag },
        ...(bits.set
          ? [
              {
                label: 'set',
                bits: binary!.slice(tagBits, tagBits + bits.set),
                value: next.set,
              },
            ]
          : []),
        {
          label: 'offset',
          bits: binary!.slice(-bits.offset),
          value: next.offset,
        },
      ]
    : [];

  return (
    <section
      className="array-explorer cache-explorer"
      aria-label="Interactive cache explorer"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Cache explorer</span>
          <h3>Predict, then place the line.</h3>
        </div>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Teaching model · four 16-byte lines · 8-bit addresses · exact LRU ·
        write-allocate · manual steps
      </p>
      <fieldset className="operation-controls">
        <legend>Choose a cache and an access stream</legend>
        <label>
          Organization
          <select
            value={organization}
            onChange={(e) => {
              setOrganization(e.target.value);
              restart();
            }}
          >
            {ORGANIZATIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Access stream
          <select
            value={streamId}
            onChange={(e) => {
              setStreamId(e.target.value);
              restart();
            }}
          >
            {STREAMS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Write policy
          <select
            value={policy}
            onChange={(e) => {
              setPolicy(e.target.value as WritePolicy);
              restart();
            }}
          >
            <option value="write-back">Write-back</option>
            <option value="write-through">Write-through</option>
          </select>
        </label>
      </fieldset>
      <ol className="access-stream" aria-label="Accesses in order">
        {steps.map((step, i) => (
          <li
            key={i}
            className={i === position ? 'next' : ''}
            aria-current={i === position ? 'step' : undefined}
          >
            <code>
              {step.access.kind === 'read' ? 'R' : 'W'} {step.access.address}
            </code>
            <span>
              {i < position
                ? step.hit
                  ? 'hit'
                  : 'miss'
                : i === position
                  ? 'next'
                  : ''}
            </span>
          </li>
        ))}
      </ol>
      {next && (
        <ol
          className="cache-fields"
          aria-label={`Address ${next.access.address} as ${ADDRESS_BITS} bits`}
        >
          {fields.map((field) => (
            <li key={field.label} style={{ flexGrow: field.bits.length }}>
              <code>{field.bits}</code>
              <span>
                {field.label} {field.value}
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className="cache-table-wrap">
        <table className="cache-table">
          <caption>
            {position ? `Cache after access ${position}` : 'Cold cache'}
          </caption>
          <thead>
            <tr>
              <th scope="col">Set</th>
              {Array.from({ length: geometry.ways }, (_, way) => (
                <th scope="col" key={way}>
                  Way {way}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((row, set) => {
              const full = row.every(Boolean) && row.length > 1;
              const oldest = full
                ? row.reduce(
                    (o, line, i) => (line!.lastUse < row[o]!.lastUse ? i : o),
                    0,
                  )
                : -1;
              return (
                <tr key={set} className={next?.set === set ? 'lookup' : ''}>
                  <th scope="row">
                    {set}
                    {next?.set === set && <span> next lookup</span>}
                  </th>
                  {row.map((line, way) => (
                    <td
                      key={way}
                      className={
                        shown && shown.set === set && shown.way === way
                          ? 'changed'
                          : ''
                      }
                    >
                      {line ? (
                        <>
                          <strong>block {line.block}</strong>
                          <span>
                            tag {line.tag}
                            {line.dirty ? ' · dirty' : ''}
                          </span>
                          {way === oldest && <span>next victim</span>}
                          {shown && shown.set === set && shown.way === way && (
                            <span>this access</span>
                          )}
                        </>
                      ) : (
                        <span>empty</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <strong>
            {next
              ? `Access ${position + 1} of ${steps.length}`
              : 'Trace complete'}
          </strong>
          <p>{story}</p>
          {!next && (
            <p>
              {total.hits} hits, {total.misses} misses ({total.compulsory}{' '}
              compulsory, {total.conflict} conflict, {total.capacity} capacity).
              Next-level writes: {total.nextLevelWrites}. Predictions: {correct}{' '}
              of {predicted} correct.
            </p>
          )}
        </div>
        <div className="prediction-controls">
          {next ? (
            <>
              <button
                type="button"
                className="primary-control"
                onClick={() => reveal('hit')}
              >
                Predict hit
              </button>
              <button
                type="button"
                className="primary-control"
                onClick={() => reveal('miss')}
              >
                Predict miss
              </button>
              <button type="button" onClick={() => reveal(null)}>
                Reveal without predicting
              </button>
            </>
          ) : (
            <button type="button" onClick={restart}>
              Run the trace again
            </button>
          )}
        </div>
      </div>
      <noscript>
        <p>
          The interactive controls need JavaScript. The worked trace in the
          lesson gives the same steps in text.
        </p>
      </noscript>
    </section>
  );
}
