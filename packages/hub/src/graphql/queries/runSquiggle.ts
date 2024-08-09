import { Prisma } from "@prisma/client";
import crypto from "crypto";

import {
  SqLinker,
  SqModule,
  SqModuleOutput,
  SqProject,
  SqValue,
} from "@quri/squiggle-lang";

import { SAMPLE_COUNT_DEFAULT, XY_POINT_LENGTH_DEFAULT } from "@/constants";
import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { parseSourceId } from "@/squiggle/components/linker";

import { NotFoundError } from "../errors/NotFoundError";

function getKey(code: string, seed: string): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({ code, seed }))
    .digest("base64");
}

export const squiggleValueToJSON = (value: SqValue): any => {
  return value.asJS();
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

export const squiggleLinker: SqLinker = {
  resolve(name) {
    return name;
  },
  async loadModule(sourceId: string) {
    const { owner, slug } = parseSourceId(sourceId);
    const model = await prisma.model.findFirst({
      where: {
        slug,
        owner: { slug: owner },
      },
      include: {
        currentRevision: {
          include: {
            squiggleSnippet: true,
          },
        },
      },
    });

    if (!model) {
      throw new NotFoundError();
    }

    const content = model?.currentRevision?.squiggleSnippet;
    if (content) {
      return new SqModule({ name: sourceId, code: content.code });
    } else {
      throw new NotFoundError();
    }
  },
};

export async function runSquiggle(
  code: string,
  seed: string
): Promise<SqModuleOutput> {
  const MAIN = "main";

  const env = {
    sampleCount: SAMPLE_COUNT_DEFAULT, // int
    xyPointLength: XY_POINT_LENGTH_DEFAULT, // int
    seed: seed,
  };

  const project = new SqProject({
    environment: env,
    linker: squiggleLinker,
  });

  project.setSimpleHead(MAIN, code);
  return await project.waitForOutput(MAIN);
}

//Warning: Caching will break if any imports change. It would be good to track this. Maybe we could compile the import tree, then store that as well, and recalculate whenever either that or the code changes.
export async function runSquiggleWithCache(
  code: string,
  seed: string
): Promise<SquiggleOutput> {
  const key = getKey(code, seed);
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
    } as unknown as SquiggleOutput;
  }

  const { result: outputResult } = await runSquiggle(code, seed);

  const result: SquiggleOutput = outputResult.ok
    ? {
        isCached: false,
        isOk: true,
        resultJSON: squiggleValueToJSON(outputResult.value.result),
        bindingsJSON: squiggleValueToJSON(
          outputResult.value.bindings.asValue()
        ),
      }
    : {
        isCached: false,
        isOk: false,
        errorString: outputResult.value.toString(),
      };

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
}

builder.queryField("runSquiggle", (t) =>
  t.field({
    type: SquiggleOutputObj,
    args: {
      code: t.arg.string({ required: true }),
      seed: t.arg.string({ required: false }),
    },
    async resolve(_, { code, seed }) {
      const result = await runSquiggleWithCache(code, seed || "DEFAULT_SEED");
      return result;
    },
  })
);
