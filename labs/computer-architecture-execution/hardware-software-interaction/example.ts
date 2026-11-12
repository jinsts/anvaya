// Educational instruction-index model, not an ISA emulator or a real syscall.
export type CpuState = Readonly<{
  mode: 'user' | 'kernel';
  pc: number;
  resumePc: number | null;
}>;

export type Entry = 'syscall' | 'interrupt' | 'fault';

function address(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(
      'Instruction indices must be nonnegative safe integers.',
    );
  }
}

export function enterKernel(
  state: CpuState,
  event: Entry,
  handlerPc: number,
): CpuState {
  address(state.pc);
  address(handlerPc);
  if (state.mode !== 'user' || state.resumePc !== null) {
    throw new Error('This model accepts entry only from user mode.');
  }
  // A syscall consumes its instruction. A restartable fault retries its own.
  // An interrupt arrives between instructions; pc already names the next one.
  const resumePc = event === 'syscall' ? state.pc + 1 : state.pc;
  address(resumePc);
  return { mode: 'kernel', pc: handlerPc, resumePc };
}

export function returnToUser(state: CpuState): CpuState {
  address(state.pc);
  if (state.mode !== 'kernel' || state.resumePc === null) {
    throw new Error('A saved user context is required.');
  }
  address(state.resumePc);
  return { mode: 'user', pc: state.resumePc, resumePc: null };
}

export function privilegeExample(): string {
  const user: CpuState = { mode: 'user', pc: 12, resumePc: null };
  const syscall = returnToUser(enterKernel(user, 'syscall', 100));
  const fault = returnToUser(enterKernel(user, 'fault', 200));
  const interrupt = returnToUser(enterKernel(user, 'interrupt', 300));
  return [
    `syscall resumes at ${syscall.pc}`,
    `fault retries ${fault.pc}`,
    `interrupt resumes at ${interrupt.pc}`,
  ].join('\n');
}
