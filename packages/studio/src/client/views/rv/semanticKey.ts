// A key for what a Squiggle module computes, ignoring how it's written: a hash
// of its AST without source locations or comments (QA #15). The relative
// values view keys its pair caches with it, so comment and whitespace edits
// reuse every computed pair, while any change to a value, a name or an import
// gets a fresh cache.
//
// Results stay correct when the key is reused: a run is deterministic for the
// same AST and environment (the seed is fixed), and the caches are per
// SqProject, which Studio replaces when an imported file changes.

import type { SqModule } from "@quri/squiggle-lang";

// AST fields that don't affect evaluation: positions (which every edit above a
// node shifts), the module's comments, and the Program's symbol index (a
// lookup table of the statements, which are serialized anyway).
const IGNORED_FIELDS = new Set(["location", "comments", "symbols"]);

// cyrb53 (public domain): a fast 53-bit string hash. No crypto.subtle, which
// non-secure `--allow-network` origins lack.
function hash53(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// The AST's JSON without the ignored fields.
export function semanticJson(module: SqModule): string | undefined {
  const ast = module.ast();
  if (!ast.ok) return undefined;
  return JSON.stringify(ast.value, (key, value: unknown) =>
    IGNORED_FIELDS.has(key) ? undefined : value
  );
}

// `ast:<hash>:<length>`, or `code:<hash>:<length>` of the raw code for a
// module that doesn't parse (no AST to compare).
export function semanticKey(module: SqModule): string {
  const json = semanticJson(module);
  return json === undefined
    ? `code:${hash53(module.code)}:${module.code.length}`
    : `ast:${hash53(json)}:${json.length}`;
}
