// First compact function-IR slice: immutable PRINT flags are stored as an A-Z bitmask.
// Runtime-created Sets remain supported so non-persistent printer call sites need no rewrite.
export function encodePrintFlags(flags) {
  let mask = 0;
  for (const flag of flags) {
    const code = flag.charCodeAt(0) - 65;
    if (code < 0 || code >= 26) throw new RangeError(`Unsupported PRINT flag: ${flag}`);
    mask |= 1 << code;
  }
  return mask;
}

export function hasPrintFlag(flags, flag) {
  if (typeof flags !== 'number') return flags.has(flag);
  const code = flag.charCodeAt(0) - 65;
  return code >= 0 && code < 26 && (flags & (1 << code)) !== 0;
}

// A Thunk overwhelmingly owns zero or one statement, so avoid a separate Array in those cases.
// Multi-statement thunks retain their original Array and statement objects remain untouched.
export function compactStatementVector(statements) {
  return statements.length === 0 ? null : statements.length === 1 ? statements[0] : statements;
}

export function statementVectorLength(statements) {
  return statements == null ? 0 : Array.isArray(statements) ? statements.length : 1;
}

export function statementVectorAt(statements, index) {
  return Array.isArray(statements) ? statements[index] : index === 0 ? statements : undefined;
}
