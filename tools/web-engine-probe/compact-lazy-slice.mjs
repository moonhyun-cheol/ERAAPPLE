const RANGE_BASE = 0x4000000;

function encodeRange(from, to) {
  return Number.isInteger(from) && Number.isInteger(to) && from >= 0 && to >= 0
    && from < RANGE_BASE && to < RANGE_BASE ? from * RANGE_BASE + to : [from, to];
}
function rangeFrom(range) { return typeof range === 'number' ? Math.floor(range / RANGE_BASE) : range[0]; }
function rangeTo(range) { return typeof range === 'number' ? range % RANGE_BASE : range[1]; }

export function createCompactLazy(tryParse) {
  return class Lazy {
    raw;
    value;
    constructor(raw, parser) {
      this.raw = raw;
      this.value = parser;
    }
    get() {
      if (this.raw === null) return this.value;
      const result = tryParse(this.value, this.raw);
      this.raw = null;
      this.value = result;
      return result;
    }
  };
}

export class CompactSlice {
  file;
  line;
  content;
  range;
  constructor(file, line, content, from, to) {
    this.file = file;
    this.line = line;
    this.content = content;
    this.range = encodeRange(from ?? 0, to ?? content.length);
  }
  get from() { return rangeFrom(this.range); }
  set from(value) { this.range = encodeRange(value, this.to); }
  get to() { return rangeTo(this.range); }
  set to(value) { this.range = encodeRange(this.from, value); }
  slice(from, to) {
    const newFrom = this.from + (from ?? 0);
    const newTo = to == null ? this.to : Math.min(this.to, this.from + to);
    return new CompactSlice(this.file, this.line, this.content, newFrom, newTo);
  }
  get() { return this.content.slice(this.from, this.to); }
  length() { return this.to - this.from; }
}
