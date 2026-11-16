import { expect, it } from 'vitest';
// solve(capacity, events) runs a DMA receive buffer of capacity bytes through
// events in order, starting ready and owned by the host. Events are 'submit',
// 'complete n' (the device received n bytes), 'fail' and 'reclaim'. Return
// '<owner> <phase> <bytes>' afterwards, for example 'host ready 4'. Throw an
// Error whose message names the refused event and the request's phase, such as
// 'Cannot reclaim a in-flight request.', for a transition the protocol does
// not allow, and a RangeError for a completion larger than the buffer.
export function contracts(
  solve: (capacity: number, events: string[]) => string,
) {
  it('unseen case 1', () => expect(solve(8, [])).toBe('host ready 0'));
  it('unseen case 2', () =>
    expect(solve(8, ['submit'])).toBe('device in-flight 0'));
  it('unseen case 3', () =>
    expect(solve(8, ['submit', 'complete 4'])).toBe('device completed 4'));
  it('unseen case 4', () =>
    expect(solve(8, ['submit', 'complete 4', 'reclaim'])).toBe('host ready 4'));
  it('unseen case 5', () =>
    expect(solve(8, ['submit', 'fail', 'reclaim'])).toBe('host ready 0'));
  it('unseen case 6', () =>
    expect(() => solve(8, ['submit', 'reclaim'])).toThrow(
      /reclaim.*in-flight/,
    ));
  it('unseen case 7', () =>
    expect(() => solve(8, ['submit', 'complete 9'])).toThrow(RangeError));
  it('unseen case 8', () =>
    expect(solve(8, ['submit', 'complete 8', 'reclaim', 'submit'])).toBe(
      'device in-flight 0',
    ));
  it('unseen case 9', () =>
    expect(() => solve(8, ['complete 2'])).toThrow(/complete.*ready/));
}
