import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { targetsFromArgv } from "../src/target.js";

// The command line Electron gets: in development the app path is the first
// positional argument, after any Chromium switches.

let dir: string;
let app: string;
let models: string;

beforeAll(() => {
  dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "targets-")));
  app = path.join(dir, "studio-electron");
  models = path.join(dir, "models");
  fs.mkdirSync(app);
  fs.mkdirSync(path.join(models, "values"), { recursive: true });
  fs.writeFileSync(path.join(models, "values", "numbers.squiggle"), "x = 1\n");
});

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

const file = () => path.join(models, "values", "numbers.squiggle");

describe("targetsFromArgv", () => {
  test("development: electron <app> <file>", () => {
    expect(
      targetsFromArgv(["electron", app, file()], false, { appPath: app })
    ).toEqual([
      { folder: path.join(models, "values"), file: "numbers.squiggle" },
    ]);
  });

  test("development: a Chromium switch before the app path doesn't make the app a folder to open", () => {
    expect(
      targetsFromArgv(
        [
          "electron",
          "--inspect=5456",
          app,
          file(),
          `--user-data-dir=${dir}/userdata`,
        ],
        false,
        { appPath: app }
      )
    ).toEqual([
      { folder: path.join(models, "values"), file: "numbers.squiggle" },
    ]);
  });

  test("development: `electron .` from the app folder, and the app path repeated", () => {
    expect(
      targetsFromArgv(["electron", ".", models, app], false, {
        appPath: app,
        cwd: app,
      })
    ).toEqual([{ folder: models }]);
  });

  test("packaged: every positional argument is a target", () => {
    expect(
      targetsFromArgv(["/Applications/Studio", "-psn_0_1234", models], true)
    ).toEqual([{ folder: models }]);
  });

  test("missing paths are skipped", () => {
    expect(
      targetsFromArgv(["electron", app, path.join(dir, "nope")], false, {
        appPath: app,
      })
    ).toEqual([]);
  });
});
