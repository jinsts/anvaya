export function floatBits(value: number): string {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, value, false);
  return view.getUint32(0, false).toString(2).padStart(32, '0');
}
export function textUnits(text: string) {
  return {
    bytes: new TextEncoder().encode(text).length,
    units: text.length,
    points: [...text].length,
    graphemes: [
      ...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text),
    ].length,
  };
}
