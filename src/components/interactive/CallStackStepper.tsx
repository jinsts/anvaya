import { useEffect, useRef, useState } from 'react';
// Runs the lesson's tested lifetime trace: frames, locals, heap objects and
// the handles between them after every event.
import {
  STORY,
  STORY_STACK_LIMIT,
  traceLifetimes,
} from '../../../labs/computer-architecture-execution/stack-and-heap/trace';

const snapshots = traceLifetimes(
  STORY.map((s) => s.event),
  STORY_STACK_LIMIT,
);
const W = 360;
const STACK_X = 12;
const STACK_W = 158;
const HEAP_X = 222;
const HEAP_W = 126;
const BOTTOM = 252;
const SLOT = 26;

export default function CallStackStepper() {
  const [position, setPosition] = useState(0);
  // The step index each answer belongs to, so consecutive questions all ask.
  const [answer, setAnswer] = useState<{ step: number; choice: number } | null>(
    null,
  );
  const [score, setScore] = useState({ right: 0, asked: 0 });
  const nextButton = useRef<HTMLButtonElement>(null);
  const step = STORY[position];
  const question = step?.question;
  const awaiting = question !== undefined && answer?.step !== position;
  const shown = snapshots[position]!;
  useEffect(() => {
    if (answer !== null) nextButton.current?.focus();
  }, [answer]);

  function choose(index: number) {
    setAnswer({ step: position, choice: index });
    setScore({
      right: score.right + (index === question!.answer ? 1 : 0),
      asked: score.asked + 1,
    });
    setPosition(position + 1);
  }
  function next() {
    setPosition(position + 1);
  }
  function reset() {
    setPosition(0);
    setAnswer(null);
    setScore({ right: 0, asked: 0 });
  }

  // Lay frames out bottom-up so the newest is on top.
  const frames = shown.frames.reduce<
    ((typeof shown.frames)[number] & {
      depth: number;
      y: number;
      height: number;
    })[]
  >((laid, frame, depth) => {
    const height = 30 + frame.locals.length * SLOT;
    const below = laid.at(-1)?.y ?? BOTTOM;
    return [...laid, { ...frame, depth, y: below - height - 6, height }];
  }, []);
  const heap = shown.heap.map((object, i) => ({
    ...object,
    y: 40 + i * 70,
    height: 52,
  }));
  const arrows = frames.flatMap((frame) =>
    frame.locals.flatMap((local, i) => {
      if (local.ref === null) return [];
      const target = heap.find((h) => h.id === local.ref)!;
      const y1 = frame.y + 30 + i * SLOT + SLOT / 2 - 4;
      const y2 = target.y + target.height / 2;
      return [
        {
          key: `${frame.name}-${local.name}`,
          d: `M${STACK_X + STACK_W - 6} ${y1} C${STACK_X + STACK_W + 30} ${y1} ${HEAP_X - 30} ${y2} ${HEAP_X} ${y2}`,
          dangling: !target.live,
        },
      ];
    }),
  );

  const last = STORY[position - 1];
  let story: string;
  if (!last)
    story =
      'Nothing is running yet. Step through main calling makeBuffer, and predict what each event does to the heap.';
  else {
    story = last.says;
    if (last.question && answer?.step === position - 1)
      story += ` ${answer.choice === last.question.answer ? 'Your prediction was correct.' : 'Not this time.'} ${last.question.why}`;
  }
  if (!step) story += ` Predictions: ${score.right} of ${score.asked} correct.`;

  const describe = `Stack, newest first: ${
    [...frames]
      .reverse()
      .map(
        (f) =>
          `${f.name} with ${f.locals.map((l) => `${l.name} ${l.ref === null ? 'empty' : `→ object ${l.ref}`}`).join(', ')}`,
      )
      .join('; ') || 'empty'
  }. Heap: ${heap.map((h) => `object ${h.id}, ${h.bytes} bytes, ${h.live ? 'allocated' : 'freed'}`).join('; ') || 'empty'}.`;

  return (
    <section
      className="array-explorer callstack-stepper"
      aria-label="Interactive call stack stepper"
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">Call stack stepper</span>
          <h3>Watch frames come and go, and objects stay.</h3>
        </div>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="explorer-caption">
        Tested model · frame sizes and handles are model values, not native
        addresses · manual steps
      </p>
      <svg
        className="callstack"
        viewBox={`0 0 ${W} 262`}
        role="img"
        aria-label={describe}
      >
        <defs>
          <marker
            id="callstack-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 Z" className="callstack-head" />
          </marker>
        </defs>
        <text x={STACK_X} y="18" className="column">
          Stack · {shown.stackBytes} bytes
        </text>
        <text x={HEAP_X} y="18" className="column">
          Heap · {shown.heapBytes} bytes live
        </text>
        <line
          x1={STACK_X}
          x2={STACK_X + STACK_W}
          y1={BOTTOM + 4}
          y2={BOTTOM + 4}
          className="base"
        />
        {frames.map((frame) => (
          <g key={`${frame.depth}-${frame.name}`} className="frame-box">
            <rect
              x={STACK_X}
              y={frame.y}
              width={STACK_W}
              height={frame.height}
              rx="6"
            />
            <text x={STACK_X + 10} y={frame.y + 19} className="frame-name">
              {frame.name} · {frame.bytes} B
            </text>
            {frame.locals.map((local, i) => (
              <g key={local.name}>
                <rect
                  x={STACK_X + 8}
                  y={frame.y + 28 + i * SLOT}
                  width={STACK_W - 16}
                  height={SLOT - 6}
                  rx="4"
                  className="slot"
                />
                <text
                  x={STACK_X + 14}
                  y={frame.y + 42 + i * SLOT}
                  className="local"
                >
                  {local.name}:{' '}
                  {local.ref === null ? 'empty' : `handle ${local.ref}`}
                </text>
              </g>
            ))}
          </g>
        ))}
        {heap.map((object) => (
          <g
            key={object.id}
            className={object.live ? 'object' : 'object freed'}
          >
            <rect
              x={HEAP_X}
              y={object.y}
              width={HEAP_W}
              height={object.height}
              rx="6"
            />
            <text x={HEAP_X + 10} y={object.y + 21} className="frame-name">
              object {object.id}
            </text>
            <text x={HEAP_X + 10} y={object.y + 39} className="local">
              {object.bytes} B · {object.live ? 'allocated' : 'freed'}
            </text>
          </g>
        ))}
        {arrows.map((arrow) => (
          <g
            key={`${arrow.key}-${position}`}
            className={arrow.dangling ? 'ref dangling' : 'ref'}
          >
            <path
              d={arrow.d}
              pathLength={100}
              markerEnd={arrow.dangling ? undefined : 'url(#callstack-arrow)'}
            />
            {arrow.dangling && (
              <text
                x={(STACK_X + STACK_W + HEAP_X) / 2}
                y="34"
                className="warning"
              >
                dangling
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="operation-story">
        <div role="status" aria-live="polite" aria-atomic="true">
          <strong>
            {step
              ? `Event ${position + 1} of ${STORY.length}`
              : 'Program finished'}
          </strong>
          <p>{story}</p>
          {awaiting && <p className="callstack-question">{question!.prompt}</p>}
        </div>
        <div className="prediction-controls">
          {awaiting ? (
            question!.options.map((option, i) => (
              <button
                key={option}
                type="button"
                className="primary-control"
                onClick={() => choose(i)}
              >
                {option}
              </button>
            ))
          ) : step ? (
            <button
              type="button"
              ref={nextButton}
              className="primary-control"
              onClick={next}
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
          The stepper needs JavaScript. The table below gives the same events.
        </p>
      </noscript>
    </section>
  );
}
