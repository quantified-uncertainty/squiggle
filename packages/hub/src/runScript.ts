import { Prisma, PrismaClient } from "@prisma/client";

import { SqProject, SqValue } from "@quri/squiggle-lang";

import { DEFAULT_SEED } from "@/constants";

import { ModelExport } from "../../components/dist/src/components/SquigglePlayground";
import { squiggleHubLinker } from "./squiggle/components/linker";

const prisma = new PrismaClient();

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

export async function runSquiggle2(code: string): Promise<SquiggleOutput> {
  const MAIN = "main";

  const env = {
    sampleCount: 10000, // int
    xyPointLength: 10000, // int
    seed: DEFAULT_SEED,
  };

  const project = SqProject.create({
    linker: squiggleHubLinker,
  });

  project.setSource(MAIN, code);
  await project.run(MAIN);

  const outputR = project.getOutput(MAIN);

  if (outputR.ok) {
    const _exports: ModelExport[] = outputR.value.exports
      .entries()
      .map((e) => ({
        variableName: e[0],
        variableType: e[1].tag,
        title: e[1].title(),
        docstring: e[1].context?.docstring() || "",
      }));
  }

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

async function main() {
  const model = await prisma.model.findFirst({
    where: {
      slug: "test-model",
      owner: { slug: "QURI-main" },
      // no need to check access - will be checked by Model authScopes
    },
    include: {
      currentRevision: {
        include: {
          squiggleSnippet: true,
        },
      },
    },
  });

  const firstCode = model?.currentRevision?.squiggleSnippet?.code;
  if (!firstCode) {
    throw new Error("No code found");
  }

  const startTime = performance.now();
  let response = await runSquiggle2(firstCode);
  const endTime = performance.now();
  const diff = endTime - startTime;

  console.log(firstCode, diff, response);
}
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
