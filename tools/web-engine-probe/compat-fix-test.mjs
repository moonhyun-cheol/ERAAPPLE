// Runtime verification for era-compat-fix-v1 (SELECTCASE CASEELSE execution and
// string/CSV-name variable indices). Runs against the built dist/engine.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { compile } from './dist/engine.mjs';
import { execute, textOf } from './fixture.mjs';

test('SELECTCASE runs CASEELSE and an inline #FUNCTIONS call returns its value', async () => {
  const source = new Map([['PROBE.ERB', `@SYSTEM_TITLE
LOCALS:0 = %PICK()%
PRINTFORML GOT:%LOCALS:0%
QUIT

@PICK
#FUNCTIONS
SELECTCASE 999
	CASE 0
		RETURNF "zero"
	CASE 1
		RETURNF "one"
	CASEELSE
		RETURNF "fallback"
ENDSELECT
`]]);
  const { events } = await execute(compile, source);
  assert.match(textOf(events), /GOT:fallback/);
});

test('REDRAW 0 (suppress redraw) executes instead of throwing the range error', async () => {
  // REDRAW 0 (draw off) must not throw the range error; re-enable draw then print.
  const source = new Map([['PROBE.ERB', `@SYSTEM_TITLE
REDRAW 0
REDRAW 1
PRINTL DREW
QUIT
`]]);
  const { events } = await execute(compile, source);
  assert.match(textOf(events), /DREW/);
});

test('a runtime string index is resolved through the variable CSV name table', async () => {
  const source = new Map([
    ['FLAG.CSV', '0,알파\n1,베타\n2,감마\n'],
    ['PROBE.ERB', `@SYSTEM_TITLE
LOCALS:0 = 베타
FLAG:(LOCALS:0) = 5
PRINTFORML FLAGVAL:{FLAG:1}
QUIT
`],
  ]);
  const { events } = await execute(compile, source);
  assert.match(textOf(events), /FLAGVAL:5/);
});
