import { useId } from 'react';
import type {
  MachineState,
  Unit,
  Wire,
} from '../../../labs/computer-architecture-execution/how-computers-execute-programs/datapath';

// A block diagram of a single-cycle datapath. Units and wires are named after
// the lab model's identifiers, so a step's `units` and `wires` highlight
// exactly what the tested model says the instruction uses.
const BOXES: Record<
  Unit,
  { x: number; y: number; w: number; h: number; label: string }
> = {
  pc: { x: 10, y: 10, w: 70, h: 48, label: 'PC' },
  'instruction-memory': {
    x: 110,
    y: 10,
    w: 220,
    h: 48,
    label: 'Instruction memory',
  },
  'next-pc': { x: 10, y: 100, w: 70, h: 34, label: '+1' },
  decoder: { x: 110, y: 100, w: 220, h: 34, label: 'Decoder and control' },
  registers: { x: 10, y: 176, w: 140, h: 66, label: 'Registers' },
  alu: { x: 200, y: 176, w: 130, h: 66, label: 'ALU' },
  'data-memory': { x: 110, y: 306, w: 220, h: 60, label: 'Data memory' },
};

const PATHS: Record<
  Wire,
  {
    d: string;
    label?: string;
    lx?: number;
    ly?: number;
    anchor?: 'start' | 'middle' | 'end';
  }
> = {
  'pc-to-imem': { d: 'M80 34 H108' },
  'pc-to-next': { d: 'M30 58 V98' },
  'next-to-pc': { d: 'M60 100 V60' },
  'imem-to-decoder': {
    d: 'M220 58 V98',
    label: 'instruction',
    lx: 226,
    ly: 82,
    anchor: 'start',
  },
  'decoder-to-registers': {
    d: 'M150 134 V154 H80 V174',
    label: 'register number',
    lx: 84,
    ly: 150,
    anchor: 'start',
  },
  'decoder-to-alu': {
    d: 'M290 134 V174',
    label: 'operation, constant',
    lx: 286,
    ly: 160,
    anchor: 'end',
  },
  'registers-to-alu': {
    d: 'M150 196 H198',
    label: 'operand',
    lx: 175,
    ly: 190,
  },
  'alu-to-registers': { d: 'M200 224 H152', label: 'result', lx: 175, ly: 236 },
  'alu-to-dmem': {
    d: 'M265 242 V304',
    label: 'address',
    lx: 271,
    ly: 280,
    anchor: 'start',
  },
  'registers-to-dmem': {
    d: 'M115 242 V272 H160 V304',
    label: 'value to store',
    lx: 166,
    ly: 290,
    anchor: 'start',
  },
  'dmem-to-registers': {
    d: 'M110 336 H40 V244',
    label: 'loaded value',
    lx: 46,
    ly: 296,
    anchor: 'start',
  },
};

export interface DatapathDiagramProps {
  state: MachineState;
  instruction?: string;
  units?: readonly Unit[];
  wires?: readonly Wire[];
  /** Restarts the flow animation when the step changes. */
  stepKey?: number;
  title: string;
  description: string;
}

export default function DatapathDiagram({
  state,
  instruction,
  units = [],
  wires = [],
  stepKey = 0,
  title,
  description,
}: DatapathDiagramProps) {
  const id = useId().replaceAll(':', '');
  const values: Partial<Record<Unit, string>> = {
    pc: String(state.pc),
    'instruction-memory': instruction ?? '',
    registers: `R0 = ${state.registers[0]}`,
    'data-memory': `[1000] = ${state.memory[1000]}`,
  };
  return (
    <svg
      className="datapath"
      viewBox="0 0 340 376"
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
    >
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{description}</desc>
      <defs>
        <marker
          id={`${id}-arrow`}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L8 4 L0 8 Z" className="datapath-head" />
        </marker>
        <marker
          id={`${id}-arrow-on`}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L8 4 L0 8 Z" className="datapath-head on" />
        </marker>
      </defs>
      {(Object.keys(PATHS) as Wire[]).map((wire) => {
        const on = wires.includes(wire);
        const path = PATHS[wire];
        return (
          <g key={wire} className={on ? 'datapath-wire on' : 'datapath-wire'}>
            <path
              key={on ? `${wire}-${stepKey}` : wire}
              d={path.d}
              pathLength={100}
              markerEnd={`url(#${id}-arrow${on ? '-on' : ''})`}
            />
            {path.label && (
              <text
                x={path.lx}
                y={path.ly}
                textAnchor={path.anchor ?? 'middle'}
              >
                {path.label}
              </text>
            )}
          </g>
        );
      })}
      {(Object.keys(BOXES) as Unit[]).map((unit) => {
        const box = BOXES[unit];
        const on = units.includes(unit);
        const value = values[unit];
        return (
          <g key={unit} className={on ? 'datapath-unit on' : 'datapath-unit'}>
            <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="6" />
            <text
              x={box.x + box.w / 2}
              y={box.y + (value ? 18 : box.h / 2 + 4)}
              className="datapath-label"
            >
              {box.label}
            </text>
            {value && (
              <text
                x={box.x + box.w / 2}
                y={box.y + box.h - 14}
                className="datapath-value"
              >
                {value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
