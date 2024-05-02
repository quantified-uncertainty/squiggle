import fs from "fs/promises";
import path from "path";

import { EmbeddedRunner } from "../../runners/EmbeddedRunner.js";
import { SqLinker } from "../SqLinker.js";
import { runModel } from "./index.js";
import { createModel } from "./Model.js";
import { createSession } from "./SqSession.js";

async function example() {
  const EVAL_SOURCE_ID = "main";
  const linker: SqLinker = {
    resolve: (name, fromId) => {
      if (!name.startsWith("./") && !name.startsWith("../")) {
        throw new Error("Only relative paths in imports are allowed");
      }
      const dir =
        fromId === EVAL_SOURCE_ID ? process.cwd() : path.dirname(fromId);
      return path.resolve(dir, name);
    },
    loadSource: async (importId: string) => {
      return await fs.readFile(importId, "utf-8");
    },
  };

  const session = createSession(linker, new EmbeddedRunner());

  const model = await createModel({
    name: EVAL_SOURCE_ID,
    code: `
import "./__tests__/fixtures/relative-imports/dir1/lib.squiggle" as lib1
lib1.x
  `,
  });
  const [session2, output] = await runModel(session, model);
  console.log(output);
  console.log(JSON.stringify(session2, null, 2));
}

example();
