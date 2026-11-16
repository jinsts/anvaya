import { useEffect, useRef, useState } from 'react';
// Runs the lesson's tested layout model, which the lab checks against the
// offsets a native x86-64 program reports.
import {
  DECLARED,
  byAlignment,
  layoutRecord,
  type Field,
} from '../../../labs/computer-architecture-execution/text-encoding-and-memory-layout/example';

const TYPES: Record<string, string> = {
  tag: 'char',
  ratio: 'double',
  flag: 'char',
  count: 'int32_t',
};
const TONES = ['rose', 'teal', 'amber', 'violet'];
const tone = (name: string) =>
  TONES[DECLARED.findIndex((f) => f.name === name)]!;
const COLUMNS = 8;

function describe(fields: readonly Field[]) {
  const layout = layoutRecord(fields);
  return `${layout.size} bytes with ${layout.paddingBytes} bytes of padding`;
}

export default function StructLayoutExplorer() {
  const [fields, setFields] = useState<Field[]>(DECLARED);
  const [message, setMessage] = useState(
    `Declared order: ${describe(DECLARED)}. Move a field and watch the padding.`,
  );
  const layout = layoutRecord(fields);
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());
  const focusAfterMove = useRef<string | null>(null);
  // Keep keyboard focus on the moved field; at either end, its button for the
  // blocked direction is disabled, so focus its other button instead.
  useEffect(() => {
    if (!focusAfterMove.current) return;
    const [name, direction] = focusAfterMove.current.split(':');
    focusAfterMove.current = null;
    const index = fields.findIndex((f) => f.name === name);
    const blocked =
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1);
    const other = direction === 'up' ? 'down' : 'up';
    buttons.current.get(`${name}:${blocked ? other : direction}`)?.focus();
  }, [fields]);

  function move(index: number, by: -1 | 1) {
    const target = index + by;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target]!, next[index]!];
    const before = layoutRecord(fields);
    const after = layoutRecord(next);
    setFields(next);
    focusAfterMove.current = `${fields[index]!.name}:${by < 0 ? 'up' : 'down'}`;
    setMessage(
      `Moved ${fields[index]!.name} ${by < 0 ? 'up' : 'down'}. Size ${before.size} → ${after.size} bytes; padding ${before.paddingBytes} → ${after.paddingBytes}. ${
        after.paddingBytes < before.paddingBytes
          ? 'Fewer gaps are needed before aligned fields.'
          : after.paddingBytes > before.paddingBytes
            ? 'A field now waits for a larger alignment boundary.'
            : 'The same bytes are wasted in a different place.'
      }`,
    );
  }
  function arrange(next: Field[], label: string) {
    setFields(next);
    setMessage(`${label}: ${describe(next)}.`);
  }

  // Fields and padding runs as blocks. With sizes and alignments that divide
  // the row width, no block crosses a row.
  const segments = [
    ...layout.fields.map((f) => ({
      kind: 'field' as const,
      name: f.name,
      offset: f.offset,
      size: f.size,
    })),
    ...layout.padding.map((p) => ({
      kind: 'pad' as const,
      name: 'pad',
      offset: p.offset,
      size: p.size,
    })),
  ].sort((a, b) => a.offset - b.offset);
  const rows = layout.size / COLUMNS;

  return (
    <section
      className="array-explorer layout-explorer"
      aria-label="Interactive record layout explorer"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Layout explorer</span>
          <h3>Reorder fields, count the padding.</h3>
        </div>
        <button
          type="button"
          onClick={() => arrange(DECLARED, 'Declared order')}
        >
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · x86-64 System V sizes and alignments · checked against a
        compiled C program
      </p>
      <pre
        className="layout-decl"
        aria-label="C declaration in the current order"
      >
        <code>
          {`struct record {\n${fields.map((f) => `  ${TYPES[f.name]} ${f.name};`).join('\n')}\n};`}
        </code>
      </pre>
      <ol className="layout-fields" aria-label="Fields in declaration order">
        {layout.fields.map((field, index) => (
          <li key={field.name} className={`field-${tone(field.name)}`}>
            <span className="layout-name">
              <code>
                {TYPES[field.name]} {field.name}
              </code>
              <span>
                size {field.size} · align {field.alignment} · offset{' '}
                {field.offset}
              </span>
            </span>
            <span className="layout-moves">
              <button
                type="button"
                ref={(node) => {
                  buttons.current.set(`${field.name}:up`, node);
                }}
                aria-label={`Move ${field.name} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                ref={(node) => {
                  buttons.current.set(`${field.name}:down`, node);
                }}
                aria-label={`Move ${field.name} down`}
                disabled={index === fields.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>
      <div className="prediction-controls">
        <button
          type="button"
          onClick={() =>
            arrange(byAlignment(fields), 'Largest alignment first')
          }
        >
          Sort by alignment, largest first
        </button>
      </div>
      <p className="layout-total">
        <strong>sizeof = {layout.size} bytes</strong> · padding{' '}
        {layout.paddingBytes} · alignment {layout.alignment}
      </p>
      <div
        className="layout-grid"
        role="img"
        aria-label={`Bytes 0 to ${layout.size - 1}: ${layout.fields
          .map((f) => `${f.name} at ${f.offset} to ${f.offset + f.size - 1}`)
          .join(', ')}; padding ${layout.padding
          .map((p) => `at ${p.offset} to ${p.offset + p.size - 1}`)
          .join(', ')}`}
        style={{
          gridTemplateColumns: `2.25rem repeat(${COLUMNS}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: COLUMNS }, (_, column) => (
          <span
            key={`h${column}`}
            className="layout-index"
            style={{ gridRow: 1, gridColumn: column + 2 }}
          >
            {column}
          </span>
        ))}
        {Array.from({ length: rows }, (_, row) => (
          <span
            key={`r${row}`}
            className="layout-index"
            style={{ gridRow: row + 2, gridColumn: 1 }}
          >
            +{row * COLUMNS}
          </span>
        ))}
        {segments.map((segment) => (
          <span
            key={`${segment.kind}${segment.offset}`}
            className={
              segment.kind === 'pad'
                ? 'layout-block padding'
                : `layout-block field-${tone(segment.name)}`
            }
            style={{
              gridRow: Math.floor(segment.offset / COLUMNS) + 2,
              gridColumn: `${(segment.offset % COLUMNS) + 2} / span ${segment.size}`,
            }}
          >
            <span>{segment.name}</span>
            {segment.size > 1 && (
              <span className="byte-offset">
                {segment.offset}–{segment.offset + segment.size - 1}
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <p>{message}</p>
        </div>
      </div>
      <noscript>
        <p>
          The move buttons need JavaScript. The declared layout is shown above;
          the lesson's table gives the reordered layout.
        </p>
      </noscript>
    </section>
  );
}
