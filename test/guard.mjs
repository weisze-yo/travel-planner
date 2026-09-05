// A standing guard for the one trap that has bitten three times in one
// session: a BACKTICK INSIDE AN HTML COMMENT inside an `html` template
// literal ends the template.
//
// Why it needs its own script rather than a grep: the backtick is usually on
// a continuation line of a multi-line comment, so a line-based
// `grep '<!--' | grep '`'` does not see it. And why it needs catching at all:
// with an even number of backticks in one file the module still PARSES —
// `node --check` and `vm.SourceTextModule` both report it fine — and the
// screen simply renders wrong, or throws `html(...).x is not a function` at
// runtime, a long way from the comment that caused it.
//
// Also runs the parse sweep, so one command covers both.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const walk = (d) => readdirSync(d, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : (e.name.endsWith('.js') ? [join(d, e.name)] : [])));

const files = walk('web/js');
let bad = 0;

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/<!--[\s\S]*?-->/g)) {
    if (m[0].includes('`')) {
      const line = src.slice(0, m.index).split('\n').length;
      console.log(`  BACKTICK IN HTML COMMENT  ${f}:${line}`);
      console.log(`      ${m[0].split('\n')[0].trim()}`);
      bad += 1;
    }
  }
  try {
    new vm.SourceTextModule(src, { identifier: f });
  } catch (e) {
    console.log(`  DOES NOT PARSE  ${f}: ${e.message}`);
    bad += 1;
  }
}

console.log(`\n${files.length} modules · ${bad} problem${bad === 1 ? '' : 's'}`);
process.exit(bad ? 1 : 0);
