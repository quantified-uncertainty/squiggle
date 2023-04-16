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

class SquiggleOutput extends AbstractSquiggleOutput {
  private MAIN = "main";
  readonly isCached = false;

  project: SqProject;

  constructor(private code: string) {
    super();
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

class CachedSquiggleOutput extends AbstractSquiggleOutput {
  readonly isCached = true;

  constructor(private cache: SquiggleCache) {
    super();
  }

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

const SquiggleOutputObj = builder
  .interfaceRef<AbstractSquiggleOutput>("SquiggleOutput")
  .implement({
    fields: (t) => ({
      isCached: t.exposeBoolean("isCached"),
    }),
  });

builder.objectType(
  builder.objectRef<AbstractSquiggleOutput>("SquiggleOkOutput"),
  {
    name: "SquiggleOkOutput",
    interfaces: [SquiggleOutputObj],
    isTypeOf: (value) =>
      value instanceof AbstractSquiggleOutput && value.isOk(),
    fields: (t) => ({
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

builder.objectType(
  builder.objectRef<AbstractSquiggleOutput>("SquiggleErrorOutput"),
  {
    name: "SquiggleErrorOutput",
    interfaces: [SquiggleOutputObj],
    isTypeOf: (value) =>
      value instanceof AbstractSquiggleOutput && !value.isOk(),
    fields: (t) => ({
      errorString: t.string({
        resolve(result) {
          return result.getErrorString();
        },
      }),
    }),
  }
);

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
