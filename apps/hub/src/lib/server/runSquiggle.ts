import crypto from "crypto";

import { Prisma } from "@quri/hub-db";
import { parseSourceId } from "@quri/hub-linker";
import {
  defaultSquiggleVersion,
  squiggleLangByVersion,
  SquiggleVersion,
  versionSupportsSqProjectV2,
} from "@quri/versioned-squiggle-components";

import { SAMPLE_COUNT_DEFAULT, XY_POINT_LENGTH_DEFAULT } from "@/lib/constants";
import { prisma } from "@/lib/server/prisma";
import { modelWhereCanRead } from "@/models/authHelpers";

function getKey(code: string, seed: string): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({ code, seed }))
    .digest("base64");
}

export const squiggleValueToJSON = (
  // This is `SqValue`, but it's versioned, so I can't import the correct type easily here.
  value: { asJS: () => any }
): any => {
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

// This function outputs a _versioned_ `SqModuleOutput`.
// For this reason, its return type is not explicitly typed.
export async function runSquiggle({
  code,
  seed,
  squiggleVersion,
}: {
  code: string;
  seed: string;
  squiggleVersion?: SquiggleVersion;
}) {
  const MAIN = "main";

  const env = {
    sampleCount: SAMPLE_COUNT_DEFAULT, // int
    xyPointLength: XY_POINT_LENGTH_DEFAULT, // int
    seed,
  };
  const version = squiggleVersion ?? defaultSquiggleVersion;

  if (!versionSupportsSqProjectV2.plain(version)) {
    throw new Error("Unsupported Squiggle version");
  }

  const squiggle = await squiggleLangByVersion(version);

  // Note that this linker is different from the one in @quri/hub-linker: it loads models directly from the database.
  // TODO : explore the possibility of implementing an alternative API client that supports `HubApiClient` interface but requests models from the database.
  // If we had such a client, we could parameterize the linker with it.
  const linker: ReturnType<typeof squiggle.makeSelfContainedLinker> = {
    resolve(name) {
      return name;
    },
    async loadModule(sourceId: string) {
      const { owner, slug } = parseSourceId(sourceId);
      const model = await prisma.model.findFirst({
        where: await modelWhereCanRead({
          slug,
          owner: { slug: owner },
        }),
        include: {
          currentRevision: {
            include: {
              squiggleSnippet: true,
            },
          },
        },
      });

      if (!model) {
        throw new Error("Not found");
      }

      const content = model?.currentRevision?.squiggleSnippet;
      if (content) {
        return new squiggle.SqModule({
          name: sourceId,
          code: content.code,
        }) as any;
      } else {
        throw new Error("Not found");
      }
    },
  };

  const project = new squiggle.SqProject({
    environment: env,
    linker: linker as any,
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

  const { result: outputResult } = await runSquiggle({ code, seed });

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
