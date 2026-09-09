// Map-compatible label storage optimized for empty and singleton thunks.
export class CompactLabelMap {
  key;
  value;
  overflow;

  set(key, value) {
    if (this.overflow) {
      this.overflow.set(key, value);
    } else if (this.key === undefined || this.key === key) {
      this.key = key;
      this.value = value;
    } else {
      this.overflow = new Map([[this.key, this.value], [key, value]]);
      this.key = undefined;
      this.value = undefined;
    }
    return this;
  }

  get(key) {
    if (this.overflow) return this.overflow.get(key);
    return this.key === key ? this.value : undefined;
  }

  has(key) {
    if (this.overflow) return this.overflow.has(key);
    return this.key !== undefined && this.key === key;
  }

  forEach(callback, thisArg) {
    if (this.overflow) {
      this.overflow.forEach((value, key) => callback.call(thisArg, value, key, this));
    } else if (this.key !== undefined) {
      callback.call(thisArg, this.value, this.key, this);
    }
  }

  get size() {
    return this.overflow?.size ?? (this.key === undefined ? 0 : 1);
  }
}
