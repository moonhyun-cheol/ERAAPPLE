// Only LOCAL/LOCALS use this. Keep real arrays, cell classes, sizes and all
// upstream get/set/reset operations; defer just an untouched array's allocation.
export function deferLocalArray(cell, size, zero) {
  // Preserve Array(size)'s constructor-time behaviour for unusual declarations.
  if (!Number.isInteger(size) || size < 0 || size > 0xffffffff) {
    cell.value = new Array(size).fill(zero);
    return;
  }
  const assign = value => Object.defineProperty(cell, 'value', {
    value, writable: true, enumerable: true, configurable: true
  });
  Object.defineProperty(cell, 'value', {
    enumerable: true, configurable: true,
    get() {
      const value = new Array(size).fill(zero);
      assign(value);
      return value;
    },
    set(value) { assign(value); }
  });
}