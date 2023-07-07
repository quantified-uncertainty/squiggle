import crypto from "crypto";
import { Prisma } from "@prisma/client";

import {
  SqAbstractDistribution,
  SqProject,
  SqValue,
} from "@quri/squiggle-lang";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

function getKey(code: string): string {
  return crypto.createHash("md5").update(code).digest("base64");
}

export const squiggleValueToJSON = (value: SqValue) => {
  // this is a lazy shortcut to traverse the value tree; should be reimplemented without parse/stringify
  return JSON.parse(
    JSON.stringify(value.asJS(), (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value.entries());
      }
      if (value instanceof SqAbstractDistribution) {
        return value.toString();
      }
      return value;
    })
  );
};

type SquiggleOutput = {
  isCached: boolean;
} & (
  | {
      isOk: false;
      errorString: string;
      resultJSON?: undefined;
      bindingsJSON?: undefined;
    }
  | {
      isOk: true;
      errorString?: undefined;
      resultJSON: Prisma.JsonValue;
      bindingsJSON: Prisma.JsonValue;
    }
);

const SquiggleOutputObj = builder
  .interfaceRef<SquiggleOutput>("SquiggleOutput")
  .implement({
    fields: (t) => ({
      isCached: t.exposeBoolean("isCached"),
    }),
  });

builder.objectType(
  builder.objectRef<Extract<SquiggleOutput, { isOk: true }>>(
    "SquiggleOkOutput"
  ),
  {
    name: "SquiggleOkOutput",
    interfaces: [SquiggleOutputObj],
    isTypeOf: (value) => (value as SquiggleOutput).isOk,
    fields: (t) => ({
      resultJSON: t.string({
        resolve(obj) {
          return JSON.stringify(obj.resultJSON);
        },
      }),
      bindingsJSON: t.string({
        resolve(obj) {
          return JSON.stringify(obj.bindingsJSON);
        },
      }),
    }),
  }
);

builder.objectType(
  builder.objectRef<Extract<SquiggleOutput, { isOk: false }>>(
    "SquiggleErrorOutput"
  ),
  {
    name: "SquiggleErrorOutput",
    interfaces: [SquiggleOutputObj],
    isTypeOf: (value) => !(value as SquiggleOutput).isOk,
    fields: (t) => ({
      errorString: t.exposeString("errorString"),
    }),
  }
);

function runSquiggle(code: string): SquiggleOutput {
  const MAIN = "main";

  const project = SqProject.create();

  project.setSource(MAIN, code);
  project.run(MAIN);

  const outputR = project.getOutput(MAIN);

  return outputR.ok
    ? {
        isCached: false,
        isOk: true,
        resultJSON: squiggleValueToJSON(outputR.value.result),
        bindingsJSON: squiggleValueToJSON(outputR.value.bindings.asValue()),
      }
    : {
        isCached: false,
        isOk: false,
        errorString: outputR.value.toString(),
      };
}

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
        return {
          isCached: true,
          isOk: cached.ok,
          errorString: cached.error,
          resultJSON: cached.result,
          bindingsJSON: cached.bindings,
        } as unknown as SquiggleOutput; // cache is less strictly typed than SquiggleOutput, so we have to force-cast it
      }
      const result = runSquiggle(code);
      await prisma.squiggleCache.upsert({
        where: { id: key },
        create: {
          id: key,
          ok: result.isOk,
          result: result.resultJSON ?? undefined,
          bindings: result.bindingsJSON ?? undefined,
          error: result.errorString,
        },
        update: {
          ok: result.isOk,
          result: result.resultJSON ?? undefined,
          bindings: result.bindingsJSON ?? undefined,
          error: result.errorString,
        },
      });
      return result;
    },
  })
);
