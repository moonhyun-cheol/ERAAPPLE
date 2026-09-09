// Keep the upstream JSON grammar (nested arrays of decimal strings).
// reset() zero-fills the declared storage before consuming this prefix. Never
// trim an extended dimension: its final zero can carry a runtime array length.
export function compactIntegers(value, shape, depth = 0) {
  if (!Array.isArray(shape) || depth >= shape.length) throw new Error('Missing integer save shape');
  let end = value.length;
  const leaf = depth === shape.length - 1;
  if (leaf && end <= shape[depth]) {
    while (end && value[end - 1] === 0n) end--;
  }
  const result = new Array(end);
  for (let i = 0; i < end; i++) {
    result[i] = leaf ? value[i].toString() : compactIntegers(value[i], shape, depth + 1);
  }
  if (!leaf && end <= shape[depth]) {
    while (end && result[end - 1].length === 0) end--;
    result.length = end;
  }
  return result;
}
