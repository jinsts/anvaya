// Illustrative absolute-address relocation in word-addressed memory.
// This is not an ELF parser, assembler, native compiler, or dynamic loader.
export interface ObjectModule {
  words: readonly number[];
  definitions: Readonly<Record<string, number>>;
  references: readonly { at: number; symbol: string }[];
}

export function link(modules: readonly ObjectModule[], loadBase = 0) {
  if (!Number.isSafeInteger(loadBase) || loadBase < 0) {
    throw new RangeError('loadBase must be a nonnegative safe integer');
  }
  const symbols = new Map<string, number>();
  const image: number[] = [];
  const patches: { at: number; symbol: string }[] = [];
  for (const module of modules) {
    const start = image.length;
    if (!Number.isSafeInteger(loadBase + start + module.words.length)) {
      throw new RangeError('Image address exceeds the safe integer range');
    }
    if (!module.words.every(Number.isSafeInteger)) {
      throw new RangeError('Words must be safe integers');
    }
    const validOffset = (offset: number) =>
      Number.isInteger(offset) && offset >= 0 && offset < module.words.length;
    for (const [name, offset] of Object.entries(module.definitions)) {
      if (!name || !validOffset(offset))
        throw new RangeError('Invalid definition');
      if (symbols.has(name)) throw new Error(`Duplicate symbol: ${name}`);
      symbols.set(name, loadBase + start + offset);
    }
    const patchedOffsets = new Set<number>();
    for (const reference of module.references) {
      if (!reference.symbol || !validOffset(reference.at)) {
        throw new RangeError('Invalid relocation');
      }
      if (patchedOffsets.has(reference.at))
        throw new Error('Duplicate relocation');
      patchedOffsets.add(reference.at);
      patches.push({ at: start + reference.at, symbol: reference.symbol });
    }
    for (const word of module.words) image.push(word);
  }
  for (const patch of patches) {
    const address = symbols.get(patch.symbol);
    if (address === undefined)
      throw new Error(`Undefined symbol: ${patch.symbol}`);
    image[patch.at] = address;
  }
  return { image, symbols };
}

export function linkingExample(): string {
  const executable = link(
    [
      {
        words: [0, 99],
        definitions: { entry: 0 },
        references: [{ at: 0, symbol: 'helper' }],
      },
      { words: [7], definitions: { helper: 0 }, references: [] },
    ],
    100,
  );
  return `image: [${executable.image.join(', ')}]\nentry: ${executable.symbols.get('entry')}\nhelper: ${executable.symbols.get('helper')}`;
}
