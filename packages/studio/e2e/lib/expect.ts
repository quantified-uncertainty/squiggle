import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import type { ExpectStatic } from "vitest";

// `expect` for scenario files. Import it from here, not from "vitest":
// scenarios are also loaded by e2e:shoot, which runs outside vitest, where
// importing "vitest" throws ("Vitest failed to access its internal state").
//
// Under `pnpm e2e` this is vitest's own expect (vitest.e2e.config.ts sets
// `globals: true`). Elsewhere it is the same matchers on chai, built from
// vitest's own copies of chai and @vitest/expect.

type Chai = {
  use(plugin: unknown): void;
  expect: (value: unknown, message?: string) => unknown;
};
type VitestExpectModule = {
  JestExtend: unknown;
  JestChaiExpect: unknown;
  JestAsymmetricMatchers: unknown;
};

async function standaloneExpect(): Promise<ExpectStatic> {
  const fromVitest = createRequire(
    createRequire(import.meta.url).resolve("vitest/package.json")
  );
  const load = (specifier: string): Promise<unknown> =>
    import(pathToFileURL(fromVitest.resolve(specifier)).href);
  const chai = (await load("chai")) as Chai;
  const matchers = (await load("@vitest/expect")) as VitestExpectModule;
  chai.use(matchers.JestExtend);
  chai.use(matchers.JestChaiExpect);
  chai.use(matchers.JestAsymmetricMatchers);
  const expect = (value: unknown, message?: string) =>
    chai.expect(value, message);
  return Object.assign(expect, chai.expect) as unknown as ExpectStatic;
}

const vitestGlobal = (globalThis as { expect?: ExpectStatic }).expect;

export const expect: ExpectStatic = vitestGlobal ?? (await standaloneExpect());
