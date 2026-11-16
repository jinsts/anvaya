import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { int32Bytes, parseListing, run } from '../reading-assembly/x86';

// The lesson's transfer task: GCC's bump at -O2 with 41 at address 2000.
it('changes memory only at the store', () => {
  const listing = parseListing(
    readFileSync(
      'labs/computer-architecture-execution/compilation-and-execution/native/bump-O2.txt',
      'utf8',
    ),
  );
  const { steps } = run([listing], 'bump', {
    args: [2000n],
    memory: [{ address: 2000n, bytes: int32Bytes([41]) }],
    watch: [{ address: 2000n, bytes: 4 }],
  });
  const after = (text: string) => steps.find((s) => s.text === text)!;
  const value = (bytes: number[]) => bytes[0]! + bytes[1]! * 256;
  expect(after('movl (%rdi), %eax').registers.rax).toBe(41n);
  expect(value(after('movl (%rdi), %eax').watched[0]!)).toBe(41);
  expect(after('addl $1, %eax').registers.rax).toBe(42n);
  expect(value(after('addl $1, %eax').watched[0]!)).toBe(41);
  expect(value(after('movl %eax, (%rdi)').watched[0]!)).toBe(42);
});
