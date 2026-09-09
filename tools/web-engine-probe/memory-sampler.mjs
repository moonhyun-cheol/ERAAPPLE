const mib = bytes => Math.round(bytes / 2 ** 20 * 1000) / 1000;

export function sampleMemory(label, { forceGc = false, details = {} } = {}) {
  const gcPerformed = forceGc && typeof global.gc === 'function';
  if (gcPerformed) global.gc();
  const usage = process.memoryUsage();
  return {
    label,
    gcRequested: forceGc,
    gcPerformed,
    bytes: { heapUsed: usage.heapUsed, heapTotal: usage.heapTotal, rss: usage.rss,
      external: usage.external, arrayBuffers: usage.arrayBuffers },
    mib: { heapUsed: mib(usage.heapUsed), heapTotal: mib(usage.heapTotal), rss: mib(usage.rss),
      external: mib(usage.external), arrayBuffers: mib(usage.arrayBuffers) },
    details
  };
}

export function sampleLifecycle(label, details = {}) {
  return {
    label,
    natural: sampleMemory(label, { details }),
    forcedGc: sampleMemory(label, { forceGc: true, details })
  };
}