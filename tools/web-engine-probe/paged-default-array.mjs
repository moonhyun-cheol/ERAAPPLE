// Array-compatible fixed-shape hybrid storage. One-dimensional values use a
// dense backing directly; nested leaves start sparse, cap their page size to
// the leaf width, and promote to a dense backing once sparse allocation would
// consume a configurable share of the logical row.
const DEFAULT_PAGE_SIZE = 256;
const DEFAULT_DENSE_THRESHOLD = 0.75;
const states = new WeakMap();

const arrayIndex = property => {
  if (typeof property !== 'string' || property === '') return null;
  const index = Number(property);
  return Number.isInteger(index) && index >= 0 && index < 0xffffffff && String(index) === property ? index : null;
};
const keyOf = path => path.join('/');
const samePrefix = (candidate, prefix) => prefix.every((value, index) => candidate[index] === value);
const pathOf = key => key === '' ? [] : key.split('/').map(Number);
const nonDefaultIn = (array, zero) => {
  let count = 0;
  for (let index = 0; index < array.length; index++) if (array[index] !== undefined && array[index] !== zero) count++;
  return count;
};

export function createPagedArray(shape, zero, {
  pageSize = DEFAULT_PAGE_SIZE,
  denseThreshold = DEFAULT_DENSE_THRESHOLD
} = {}) {
  if (!Array.isArray(shape) || shape.length < 1 || shape.length > 3) throw new RangeError('Paged arrays require 1-3 dimensions');
  const dimensions = shape.map(size => {
    // Let Array validate the same integer/range rules as the replaced allocation.
    const probe = new Array(size);
    return probe.length;
  });
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new RangeError('Invalid page size');
  if (!(denseThreshold > 0 && denseThreshold <= 1)) throw new RangeError('Invalid dense threshold');

  const leafSize = dimensions.at(-1);
  const effectivePageSize = Math.max(1, Math.min(pageSize, leafSize || 1));
  const state = {
    dimensions, zero, requestedPageSize: pageSize, pageSize: effectivePageSize, denseThreshold,
    pages: new Map(), denseLeaves: new Map(), leafProxies: new Map(), lengths: new Map(), assigned: new Map(),
    version: 0, root: null
  };
  const lengthAt = (depth, path) => state.lengths.get(keyOf(path)) ?? dimensions[depth];
  const pageMap = (path, create = false) => {
    const key = keyOf(path);
    let result = state.pages.get(key);
    if (!result && create) state.pages.set(key, result = new Map());
    return result;
  };
  const promote = (path, length, target = null) => {
    const key = keyOf(path);
    let dense = state.denseLeaves.get(key);
    if (dense) return dense;
    dense = target ?? new Array(length);
    dense.length = length;
    dense.fill(zero);
    const pages = state.pages.get(key);
    if (pages) {
      for (const [pageIndex, page] of pages) {
        const start = pageIndex * effectivePageSize;
        for (let offset = 0; offset < page.values.length && start + offset < length; offset++) {
          if (page.values[offset] !== zero) dense[start + offset] = page.values[offset];
        }
      }
      state.pages.delete(key);
    }
    state.denseLeaves.set(key, dense);
    return dense;
  };
  const readLeaf = (path, index) => {
    const dense = state.denseLeaves.get(keyOf(path));
    if (dense) return dense[index] === undefined ? zero : dense[index];
    const page = pageMap(path)?.get(Math.floor(index / effectivePageSize));
    return page ? page.values[index % effectivePageSize] : zero;
  };
  const writeLeaf = (path, index, value, length, proxy, target) => {
    const key = keyOf(path);
    const dense = state.denseLeaves.get(key);
    if (dense) {
      if (dense.length < length) dense.push(...new Array(length - dense.length).fill(zero));
      dense[index] = value;
      return;
    }
    const pageIndex = Math.floor(index / effectivePageSize), offset = index % effectivePageSize;
    let pages = pageMap(path);
    let page = pages?.get(pageIndex);
    if (value === zero) {
      if (!page || page.values[offset] === zero) return;
      page.values[offset] = zero;
      if (--page.nonDefault === 0) {
        pages.delete(pageIndex);
        if (pages.size === 0) state.pages.delete(key);
      }
      return;
    }
    if (!page) {
      pages = pageMap(path, true);
      pages.set(pageIndex, page = { values: new Array(effectivePageSize).fill(zero), nonDefault: 0 });
    }
    if (page.values[offset] === zero) page.nonDefault++;
    page.values[offset] = value;
    if (pages.size * effectivePageSize >= Math.max(1, Math.ceil(length * denseThreshold))) {
      promote(path, length, target);
      if (proxy) state.leafProxies.set(key, proxy);
    }
  };
  const truncate = (depth, path, length) => {
    if (depth === dimensions.length - 1) {
      const key = keyOf(path);
      const dense = state.denseLeaves.get(key);
      if (dense) {
        dense.length = length;
        return;
      }
      const pages = pageMap(path);
      if (pages) for (const [pageIndex, page] of pages) {
        const start = pageIndex * effectivePageSize;
        if (start >= length) pages.delete(pageIndex);
        else if (start + effectivePageSize > length) {
          for (let offset = Math.max(0, length - start); offset < effectivePageSize; offset++) {
            if (page.values[offset] !== zero) { page.values[offset] = zero; page.nonDefault--; }
          }
          if (page.nonDefault === 0) pages.delete(pageIndex);
        }
      }
      if (pages?.size === 0) state.pages.delete(key);
      return;
    }
    for (const collection of [state.pages, state.denseLeaves, state.leafProxies, state.lengths, state.assigned]) {
      for (const key of [...collection.keys()]) {
        const candidate = pathOf(key);
        if (samePrefix(candidate, path) && candidate.length > depth && candidate[depth] >= length) collection.delete(key);
      }
    }
  };
  const valueAt = (depth, path, index) => {
    if (depth === dimensions.length - 1) return readLeaf(path, index);
    const childPath = [...path, index], childKey = keyOf(childPath);
    const assigned = state.assigned.get(childKey);
    if (assigned !== undefined) return assigned;
    return state.leafProxies.get(childKey) ?? make(depth + 1, childPath);
  };
  const make = (depth, path) => {
    const isLeaf = depth === dimensions.length - 1;
    const initialLength = lengthAt(depth, path);
    const target = isLeaf && dimensions.length === 1
      ? new Array(initialLength).fill(zero)
      : new Array(initialLength);
    if (isLeaf && dimensions.length === 1) state.denseLeaves.set('', target);
    let proxy;
    proxy = new Proxy(target, {
      get(array, property, receiver) {
        // Array's native iterator performs one Proxy get per logical slot. A
        // dedicated iterator preserves its dynamic-length/value semantics but
        // reads sparse backing pages directly, avoiding that hot trap path.
        if (property === Symbol.iterator) return function* pagedValues() {
          if (!isLeaf) {
            for (let index = 0; index < array.length; index++) yield valueAt(depth, path, index);
            return;
          }
          const key = keyOf(path);
          let observedVersion = -1, dense = null, pageIndex = -1, page = null;
          for (let index = 0; index < array.length; index++) {
            const nextPageIndex = Math.floor(index / effectivePageSize);
            if (observedVersion !== state.version || nextPageIndex !== pageIndex) {
              observedVersion = state.version;
              dense = state.denseLeaves.get(key) ?? null;
              pageIndex = nextPageIndex;
              page = dense ? null : state.pages.get(key)?.get(pageIndex) ?? null;
            }
            yield dense
              ? (dense[index] === undefined ? zero : dense[index])
              : (page ? page.values[index % effectivePageSize] : zero);
          }
        };
        const index = arrayIndex(property);
        if (index == null) return Reflect.get(array, property, receiver);
        if (index >= array.length) return undefined;
        return valueAt(depth, path, index);
      },
      set(array, property, value, receiver) {
        state.version++;
        const index = arrayIndex(property);
        if (index == null) {
          if (property === 'length') {
            const previous = array.length;
            if (!Reflect.set(array, property, value, receiver)) return false;
            state.lengths.set(keyOf(path), array.length);
            if (array.length < previous) truncate(depth, path, array.length);
            else if (isLeaf) {
              const dense = state.denseLeaves.get(keyOf(path));
              if (dense && dense !== array) dense.push(...new Array(array.length - dense.length).fill(zero));
              else if (dense === array) for (let i = previous; i < array.length; i++) array[i] = zero;
            }
            return true;
          }
          return Reflect.set(array, property, value, receiver);
        }
        if (index >= array.length) {
          const previous = array.length;
          array.length = index + 1;
          state.lengths.set(keyOf(path), array.length);
          if (isLeaf) {
            const dense = state.denseLeaves.get(keyOf(path));
            if (dense === array) for (let i = previous; i < index; i++) array[i] = zero;
          }
        }
        if (isLeaf) writeLeaf(path, index, value, array.length, proxy, array);
        else state.assigned.set(keyOf([...path, index]), value);
        return true;
      },
      has(array, property) {
        const index = arrayIndex(property);
        return index == null ? Reflect.has(array, property) : index < array.length;
      }
    });
    states.set(proxy, state);
    return proxy;
  };
  state.root = make(0, []);
  return state.root;
}

const nestedGet = (root, indices, start = 0) => {
  let value = root;
  for (let depth = start; depth < indices.length; depth++) value = value[indices[depth]];
  return value;
};
const nestedSet = (root, indices, value) => {
  let target = root;
  for (let depth = 0; depth < indices.length - 1; depth++) target = target[indices[depth]];
  target[indices.at(-1)] = value;
};
const directIndices = indices => indices.map(index => arrayIndex(String(index)));
const directLengthAt = (state, depth, path) => state.lengths.get(keyOf(path)) ?? state.dimensions[depth];
const directReadLeaf = (state, path, index) => {
  const key = keyOf(path), dense = state.denseLeaves.get(key);
  if (dense) return dense[index] === undefined ? state.zero : dense[index];
  const page = state.pages.get(key)?.get(Math.floor(index / state.pageSize));
  return page ? page.values[index % state.pageSize] : state.zero;
};
const directPromote = (state, path, length) => {
  const key = keyOf(path), dense = new Array(length).fill(state.zero), pages = state.pages.get(key);
  if (pages) {
    for (const [pageIndex, page] of pages) {
      const start = pageIndex * state.pageSize;
      for (let offset = 0; offset < page.values.length && start + offset < length; offset++) {
        if (page.values[offset] !== state.zero) dense[start + offset] = page.values[offset];
      }
    }
    state.pages.delete(key);
  }
  state.denseLeaves.set(key, dense);
};
const directWriteLeaf = (state, path, index, value, length) => {
  const key = keyOf(path), dense = state.denseLeaves.get(key);
  if (dense) {
    if (dense.length < length) dense.push(...new Array(length - dense.length).fill(state.zero));
    dense[index] = value;
    return;
  }
  const pageIndex = Math.floor(index / state.pageSize), offset = index % state.pageSize;
  let pages = state.pages.get(key), page = pages?.get(pageIndex);
  if (value === state.zero) {
    if (!page || page.values[offset] === state.zero) return;
    page.values[offset] = state.zero;
    if (--page.nonDefault === 0) {
      pages.delete(pageIndex);
      if (pages.size === 0) state.pages.delete(key);
    }
    return;
  }
  if (!page) {
    if (!pages) state.pages.set(key, pages = new Map());
    pages.set(pageIndex, page = { values: new Array(state.pageSize).fill(state.zero), nonDefault: 0 });
  }
  if (page.values[offset] === state.zero) page.nonDefault++;
  page.values[offset] = value;
  if (pages.size * state.pageSize >= Math.max(1, Math.ceil(length * state.denseThreshold))) directPromote(state, path, length);
};

export function pagedArrayGet(value, indices) {
  const state = states.get(value);
  if (!state) return nestedGet(value, indices);
  if (!Array.isArray(indices) || indices.length !== state.dimensions.length) throw new RangeError('Index dimensionality mismatch');
  const normalized = directIndices(indices);
  if (normalized.includes(null)) return nestedGet(state.root, indices);
  const path = [];
  for (let depth = 0; depth < state.dimensions.length - 1; depth++) {
    const index = normalized[depth];
    if (index >= directLengthAt(state, depth, path)) return nestedGet(state.root, indices);
    path.push(index);
    const assigned = state.assigned.get(keyOf(path));
    if (assigned !== undefined) return nestedGet(assigned, indices, depth + 1);
  }
  const index = normalized.at(-1);
  return index < directLengthAt(state, state.dimensions.length - 1, path) ? directReadLeaf(state, path, index) : undefined;
}

export function pagedArraySet(value, indices, next) {
  const state = states.get(value);
  if (!state) { nestedSet(value, indices, next); return; }
  if (!Array.isArray(indices) || indices.length !== state.dimensions.length) throw new RangeError('Index dimensionality mismatch');
  const normalized = directIndices(indices);
  if (normalized.includes(null)) { nestedSet(state.root, indices, next); return; }
  const path = [];
  for (let depth = 0; depth < state.dimensions.length - 1; depth++) {
    const index = normalized[depth];
    if (index >= directLengthAt(state, depth, path)) { nestedSet(state.root, indices, next); return; }
    path.push(index);
    if (state.assigned.get(keyOf(path)) !== undefined) { nestedSet(state.root, indices, next); return; }
  }
  state.version++;
  const index = normalized.at(-1), key = keyOf(path);
  let length = directLengthAt(state, state.dimensions.length - 1, path);
  if (index >= length) {
    length = index + 1;
    state.lengths.set(key, length);
  }
  directWriteLeaf(state, path, index, next, length);
}

export function pagedArrayStats(value) {
  const state = states.get(value);
  if (!state) return null;
  let pages = 0, nonDefault = 0, allocatedSlots = 0;
  for (const row of state.pages.values()) for (const page of row.values()) {
    pages++; allocatedSlots += page.values.length; nonDefault += page.nonDefault;
  }
  for (const dense of state.denseLeaves.values()) {
    allocatedSlots += dense.length;
    nonDefault += nonDefaultIn(dense, state.zero);
  }
  return {
    dimensions: [...state.dimensions], requestedPageSize: state.requestedPageSize,
    pageSize: state.pageSize, denseThreshold: state.denseThreshold,
    mode: state.dimensions.length === 1 ? 'dense-1d' : 'hybrid', pages,
    denseLeaves: state.denseLeaves.size, allocatedSlots, nonDefault
  };
}
