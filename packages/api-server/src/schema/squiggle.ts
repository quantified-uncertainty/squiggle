import crypto from "crypto";

import {
  SqAbstractDistribution,
  SqProject,
  SqValue,
} from "@quri/squiggle-lang";

import { Prisma, SquiggleCache } from "@prisma/client";
import { builder } from "../builder";
import { prisma } from "../prisma";

function getKey(code: string): string {
  return crypto.createHash("md5").update(code).digest("base64");
}

const squiggleValueToJSON = (value: SqValue) => {
  return JSON.stringify(value.asJS(), (key, value) => {
    if (value instanceof Map) {
      return Object.fromEntries(value.entries());
    }
    if (value instanceof SqAbstractDistribution) {
      return value.toString();
    }
    return value;
  });
};

abstract class AbstractSquiggleOutput {
  abstract isCached: boolean;
  abstract isOk(): boolean;
  abstract getErrorString(): string;
  abstract getResultJSON(): Prisma.JsonValue;
  abstract getBindingsJSON(): Prisma.JsonValue;
}

class SquiggleOutput implements AbstractSquiggleOutput {
  private MAIN = "main";
  readonly isCached = false;

  project: SqProject;

  constructor(private code: string) {
    this.project = SqProject.create();

    this.project.setSource(this.MAIN, code);
    this.project.run(this.MAIN);
  }

  isOk() {
    return this.project.getResult(this.MAIN).ok;
  }

  getErrorString() {
    const result = this.project.getResult(this.MAIN);
    if (result.ok) {
      return "";
    }
    return result.value.toString();
  }

  getResultJSON(): string {
    const result = this.project.getResult(this.MAIN);
    if (!result.ok) {
      return "0";
    }
    return squiggleValueToJSON(result.value);
  }

  getBindingsJSON(): string {
    const bindings = this.project.getBindings(this.MAIN);
    return squiggleValueToJSON(bindings.asValue());
  }
}

class CachedSquiggleOutput implements AbstractSquiggleOutput {
  readonly isCached = true;

  constructor(private cache: SquiggleCache) {}

  isOk() {
    return this.cache.ok;
  }

  getErrorString(): string {
    return this.cache.error || "";
  }

  getResultJSON() {
    return this.cache.result;
  }

  getBindingsJSON() {
    return this.cache.bindings;
  }
}

const SquiggleOkOutputObj = builder.objectType(
  builder.objectRef<AbstractSquiggleOutput>("SquiggleOkOutput"),
  {
    name: "SquiggleOkOutput",
    fields: (t) => ({
      isCached: t.boolean({
        resolve: (obj) => obj.isCached,
      }),
      resultJSON: t.string({
        resolve(obj) {
          return JSON.stringify(obj.getResultJSON());
        },
      }),
      bindingsJSON: t.string({
        resolve(obj) {
          return JSON.stringify(obj.getBindingsJSON());
        },
      }),
    }),
  }
);

const SquiggleErrorOutputObj = builder.objectType(
  builder.objectRef<AbstractSquiggleOutput>("SquiggleErrorOutput"),
  {
    name: "SquiggleErrorOutput",
    fields: (t) => ({
      isCached: t.boolean({
        resolve: (obj) => obj.isCached,
      }),
      errorString: t.string({
        resolve(result) {
          return result.getErrorString();
        },
      }),
    }),
  }
);

const SquiggleOutputObj = builder.unionType("SquiggleOutput", {
  types: [SquiggleOkOutputObj, SquiggleErrorOutputObj],
  resolveType: (result) => {
    return result.isOk() ? SquiggleOkOutputObj : SquiggleErrorOutputObj;
  },
});

builder.queryField("runSquiggle", (t) =>
  t.field({
    type: SquiggleOutputObj,
    args: {
      code: t.arg.string({ required: true }),
    },
    async resolve(_, { code }) {
      const key = getKey(code);

      const cached = await prisma.squiggleCache.findUnique({
        where: { id: key },
      });
      if (cached) {
        return new CachedSquiggleOutput(cached);
      }
      const result = new SquiggleOutput(code);
      await prisma.squiggleCache.upsert({
        where: { id: key },
        create: {
          id: key,
          ok: result.isOk(),
          result: result.getResultJSON(),
          bindings: result.getBindingsJSON(),
          error: result.getErrorString(),
        },
        update: {
          ok: result.isOk(),
          result: result.getResultJSON(),
          bindings: result.getBindingsJSON(),
          error: result.getErrorString(),
        },
      });
      return result;
    },
  })
);
