// Keep the upstream JSON grammar (nested arrays of decimal strings).
// reset() zero-fills the declared storage before consuming this prefix. Never
// trim an extended dimension: its final zero can carry a runtime array length.
import { pagedDenseBacking } from './paged-default-array.mjs';

export function compactIntegers(value, shape, depth = 0) {
  if (!Array.isArray(shape) || depth >= shape.length) throw new Error('Missing integer save shape');
  // Read the dense 1-D backing directly when the cell is a paged root: every
  // value[i]/value[end-1] through the Proxy allocates a property-key string, so
  // the trailing-zero scan over huge mostly-default global rows is the transient
  // day-transition serialize spike. The backing is the same Array the Proxy wraps,
  // so values, order and trim are byte-identical with no per-slot trap.
  const source = (depth === 0 && shape.length === 1 ? pagedDenseBacking(value) : null) ?? value;
  let end = source.length;
  const leaf = depth === shape.length - 1;
  if (leaf && end <= shape[depth]) {
    while (end && source[end - 1] === 0n) end--;
  }
  const result = new Array(end);
  for (let i = 0; i < end; i++) {
    result[i] = leaf ? source[i].toString() : compactIntegers(source[i], shape, depth + 1);
  }
  if (!leaf && end <= shape[depth]) {
    while (end && result[end - 1].length === 0) end--;
    result.length = end;
  }
  return result;
}
