# Studio e2e harness

Headless-Chrome tests and screenshots of Squiggle Studio (puppeteer-core and
vitest; spec §6.6). Each scenario gets its own Studio server on a temporary
copy of `fixtures/`, a local Hub stub and a fresh browser context, isolated from
`~/.squiggle-studio`.

Build the workspace dependencies once: `npx turbo run build --filter=@quri/squiggle-studio^...`.
Chrome is found like `squiggle-studio render` finds it (`CHROME_PATH` overrides).

| Command                                                                                 | What it does                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm e2e`                                                                              | Builds the client, runs every scenario's steps and checks plus the global invariants, and the harness self-tests                                                                                                                                                                            |
| `pnpm e2e --skip-needs`                                                                 | Skips scenarios tagged `needs:WPn` whose package isn't merged (what a package runs on its own branch)                                                                                                                                                                                       |
| `pnpm e2e --strict`                                                                     | Contrast violations fail too (what integration runs)                                                                                                                                                                                                                                        |
| `pnpm e2e --only smoke`                                                                 | Only scenarios with that tag, id or id prefix; other options go to vitest (`-t name`)                                                                                                                                                                                                       |
| `pnpm e2e:shoot [--only x] [--viewport 1024x768] [--label name] [--out dir] [--strict]` | Puts every scenario in its state and writes `e2e-out/<label>/{shots/NN-<id>.png, a11y/<id>.txt, manifest.json, contact-sheet.png}` (24 shots per contact sheet; then `contact-sheet-2.png`, …); `--strict` exits 1 on page errors, idle timeouts, failing steps or unexpected studio errors |
| `pnpm e2e:serve [--fixtures rv] [--dev]`                                                | A fixture server for manual or agent driving; prints `{url, root, stateDir, hub}`                                                                                                                                                                                                           |

Read `e2e-out/<label>/contact-sheet.png` (and `contact-sheet-2.png`, … for longer runs) first, then single shots, and check
`manifest.json` for `pageErrors`, `studioErrors`, `contrast` and
`unnamedButtons`.

Set `STUDIO_E2E_PORTS=5210-5219` to keep the servers in a port range, and
`STUDIO_E2E_OUT` to write somewhere other than `e2e-out/`.

## Writing a scenario

Add `scenarios/<area>.ts` (picked up automatically) exporting
`scenarios: Scenario[]`:

```ts
import { expect } from "../lib/expect.js"; // not from "vitest"
import type { Scenario } from "../lib/harness.js";

export const scenarios: Scenario[] = [
  {
    id: "output/numbers",
    title: "Numbers render with @format",
    tags: ["output"], // add "needs:WP4" when it depends on WP4's behavior
    state: { file: "values/numbers.squiggle" }, // opened before steps
    steps: async (h) => {
      await h.key("Meta+Backslash");
      await h.whenIdle();
      await h.shot("code-hidden");
    },
    check: async (h) => {
      const cards = await h.page.$$("[data-testid='output-card']");
      expect(cards).toHaveLength(7);
    },
  },
];
```

- Select by test id (`h.byTestId("statusbar-item", { "status-item": "run" })`)
  or role, never by visible text.
- Wait with `h.whenIdle()`, never with sleeps or `networkidle` (the live-reload
  stream never goes idle).
- `h.writeFile` / `h.removeFile` are agent edits on disk; `h.stopServer()` and
  `h.startServer()` restart the server on the same port.
- `e2e:shoot` runs `steps` but not `check`, so put state changes in `steps`.
- After every scenario the harness checks: no page errors, idle within 15 s,
  every button has an accessible name, no visible text below 4.5:1 contrast
  (a warning unless `--strict`), `.hidden/` and `node_modules/` never in the
  tree, and at most one command per keypress (from
  `window.__studioCommandLog`, which `?test=1` turns on).

## Fixtures

`fixtures/` holds `values/`, `errors/`, `imports/`, `hub/` (served by the Hub
stub from `hub-stub/<owner>/<slug>.squiggle`), `rv/`, `text/` and `tree/`.
`fixtures/gen.ts` generates `rv/large-120.squiggle`, `tree/.hidden/` and
`tree/node_modules/` into every fixture root. `expectations.json` lists, per
file: `views`, `defaultView`, `errorCount`, `cardCount`, `rvSpecs`. A package
adds fixtures in `fixtures/<area>/`.
