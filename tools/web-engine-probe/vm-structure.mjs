// Getter-safe structural accounting for eraJS VM ownership experiments.
const isDefault = value => value === 0n || value === '' || value === 0 || value == null;

function arrayStats(root) {
  const seen = new WeakSet();
  const stack = [root];
  let arrays = 0, slots = 0, nonDefaultSlots = 0;
  while (stack.length) {
    const value = stack.pop();
    if (!Array.isArray(value) || seen.has(value)) continue;
    seen.add(value); arrays++; slots += value.length;
    for (const item of value) {
      if (Array.isArray(item)) stack.push(item);
      else if (!isDefault(item)) nonDefaultSlots++;
    }
  }
  return { arrays, slots, nonDefaultSlots };
}

export function summarizeValueMaps(groups) {
  const seenCells = new WeakSet();
  const result = {};
  for (const [groupName, maps] of Object.entries(groups)) {
    const summary = { maps: 0, cells: 0, deferredCells: 0, allocatedCells: 0, arrays: 0, slots: 0, nonDefaultSlots: 0 };
    for (const map of maps) {
      if (!(map instanceof Map)) continue;
      summary.maps++;
      for (const cell of map.values()) {
        if (!cell || typeof cell !== 'object' || seenCells.has(cell)) continue;
        seenCells.add(cell); summary.cells++;
        const descriptor = Object.getOwnPropertyDescriptor(cell, 'value');
        if (descriptor && !('value' in descriptor)) { summary.deferredCells++; continue; }
        if (!descriptor || !Array.isArray(descriptor.value)) continue;
        summary.allocatedCells++;
        const stats = arrayStats(descriptor.value);
        summary.arrays += stats.arrays;
        summary.slots += stats.slots;
        summary.nonDefaultSlots += stats.nonDefaultSlots;
      }
    }
    result[groupName] = summary;
  }
  return result;
}

export function summarizeVmStorage(vm) {
  return summarizeValueMaps({
    global: [vm.globalMap],
    static: [...vm.staticMap.values()],
    characters: vm.characterList.map(character => character.values)
  });
}

export function censusObjectGraph(root, { top = 20 } = {}) {
  const seen = new WeakSet();
  const stack = [root];
  const constructors = new Map();
  let objects = 0, arrays = 0, arraySlots = 0, maps = 0, mapEntries = 0, strings = 0, stringCodeUnits = 0, bigints = 0;
  const primitive = value => {
    if (typeof value === 'string') { strings++; stringCodeUnits += value.length; }
    else if (typeof value === 'bigint') bigints++;
  };
  while (stack.length) {
    const value = stack.pop();
    if (value == null || (typeof value !== 'object' && typeof value !== 'function')) { primitive(value); continue; }
    if (seen.has(value)) continue;
    seen.add(value); objects++;
    const name = value.constructor?.name ?? '<null-prototype>';
    constructors.set(name, (constructors.get(name) ?? 0) + 1);
    if (Array.isArray(value)) {
      arrays++; arraySlots += value.length;
      for (const item of value) stack.push(item);
    } else if (value instanceof Map) {
      maps++; mapEntries += value.size;
      for (const [key, item] of value) { stack.push(key, item); }
    } else if (value instanceof Set) {
      for (const item of value) stack.push(item);
    } else {
      for (const key of Reflect.ownKeys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (descriptor && 'value' in descriptor) stack.push(descriptor.value);
      }
    }
  }
  return {
    objects, arrays, arraySlots, maps, mapEntries, strings, stringCodeUnits, bigints,
    topConstructors: [...constructors].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, top)
      .map(([name, count]) => ({ name, count }))
  };
}
