// The lesson's reading of two real listings: which instructions implement
// which part of the C source. A test checks that every instruction named here
// appears in the committed listing, in this order.

export interface Annotation {
  title: string;
  /** Exact C source lines this group implements. */
  source: string[];
  /** Instruction texts, tabs normalized to spaces, in listing order. */
  instructions: string[];
  note: string;
}

export const SUM_O2: Annotation[] = [
  {
    title: 'Skip the loop when count ≤ 0',
    source: ['  for (int i = 0; i < count; ++i) total += values[i];'],
    instructions: ['testl %esi, %esi', 'jle .L4'],
    note: 'test sets ZF and SF from count & count; jle jumps if count is zero or negative.',
  },
  {
    title: 'Set up: total = 0 and an end pointer',
    source: ['  int total = 0;'],
    instructions: [
      'movslq %esi, %rsi',
      'xorl %eax, %eax',
      'leaq (%rdi,%rsi,4), %rdx',
    ],
    note: 'count is sign-extended to 64 bits, total lives in eax, and rdx = values + 4 × count marks where the array ends.',
  },
  {
    title: 'Body: total += *p',
    source: ['  for (int i = 0; i < count; ++i) total += values[i];'],
    instructions: ['addl (%rdi), %eax'],
    note: 'The add reads the element straight from memory. There is no i: rdi itself walks through the array.',
  },
  {
    title: 'Advance p and loop while p ≠ end',
    source: ['  for (int i = 0; i < count; ++i) total += values[i];'],
    instructions: ['addq $4, %rdi', 'cmpq %rdx, %rdi', 'jne .L3'],
    note: 'One int is 4 bytes, so the pointer advances by 4. jne jumps back to .L3: the backward branch is the loop.',
  },
  {
    title: 'Return total in eax',
    source: ['  return total;'],
    instructions: ['ret', 'xorl %eax, %eax', 'ret'],
    note: 'The System V ABI returns an int in eax. The second exit, at .L4, returns 0 when the loop never ran.',
  },
];

export const SCALE_O2: Annotation[] = [
  {
    title: 'Save a callee-saved register',
    source: ['int scale_sum(const int *values, int count, int factor) {'],
    instructions: ['pushq %rbx'],
    note: 'rbx must hold the same value when scale_sum returns, so it is saved first. The push also leaves rsp 16-byte aligned for the call.',
  },
  {
    title: 'Keep factor where the call cannot clobber it',
    source: ['int scale_sum(const int *values, int count, int factor) {'],
    instructions: ['movl %edx, %ebx'],
    note: 'factor arrived in edx, which a callee may overwrite. ebx survives the call because sum_to must preserve it too.',
  },
  {
    title: 'Call sum_to with the arguments already in place',
    source: ['  return factor * sum_to(values, count);'],
    instructions: ['call sum_to@PLT'],
    note: 'values and count are still in rdi and esi, exactly where sum_to expects them. call pushes the return address.',
  },
  {
    title: 'Multiply, restore and return',
    source: ['  return factor * sum_to(values, count);'],
    instructions: ['imull %ebx, %eax', 'popq %rbx', 'ret'],
    note: 'The sum comes back in eax. After the multiply, pop restores the caller’s rbx and ret pops the return address.',
  },
];
