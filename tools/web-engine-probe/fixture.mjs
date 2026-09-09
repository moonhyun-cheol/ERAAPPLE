// Independently authored neutral ERB fixture; contains no original game text.
export const files = new Map([['PROBE.ERB', `@SYSTEM_TITLE
PRINTL 엔진 시험
PRINTL [0] 새 시험 [1] 저장 불러오기
INPUT
IF RESULT == 1
    LOADGLOBAL
    LOADDATA 0
ELSE
    PRINTL 정수를 입력하세요
    INPUT
    FLAG:0 = RESULT
    PRINTL 문자를 입력하세요
    INPUTS
    SAVESTR:0 = %RESULTS%
    GLOBAL:0 = 77
    SAVEGLOBAL
    SAVEDATA 0, "probe"
    PRINTL SAVED
    QUIT
ENDIF

@SYSTEM_LOADEND
PRINTFORML RESTORED:{FLAG:0}:%SAVESTR:0%:{GLOBAL:0}
QUIT
`]]);

export function externalFor(store) {
  return {
    getSavedata: async key => store.get(key),
    setSavedata: async (key, value) => { await store.set(key, value); },
    getTime: () => 1700000000000,
    getFont: () => false
  };
}

export async function execute(compile, source, inputs = [], store = new Map(), limit = 1000, seed) {
  const vm = compile(source);
  if (seed != null) vm.random.state = seed;
  const generator = vm.start(externalFor(store));
  const events = [];
  let input = null;
  let used = 0;
  for (let n = 0; n < limit; n++) {
    const result = await generator.next(input);
    input = null;
    if (result.done) return { events, used, store };
    events.push(result.value);
    if (['input', 'tinput', 'wait'].includes(result.value.type)) {
      if (used === inputs.length) {
        await generator.return();
        throw new Error('Fixture requested more input than supplied');
      }
      input = inputs[used++];
    }
  }
  await generator.return();
  throw new Error('Fixture exceeded event limit');
}

export const textOf = events => events.filter(e => e.type === 'content')
  .map(e => e.children.map(c => c.text).join('')).join('\n');
