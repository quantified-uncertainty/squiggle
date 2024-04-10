import { PrismaClient } from "@prisma/client";

import { SqLinker, SqProject } from "@quri/squiggle-lang";

import { ModelExport } from "../../../components/dist/src/components/SquigglePlayground";
import { SAMPLE_COUNT_DEFAULT, XY_POINT_LENGTH_DEFAULT } from "../constants";
import { NotFoundError } from "../graphql/errors/NotFoundError";
import { parseSourceId } from "../squiggle/components/linker";

const SOURCE_NAME = "main";

const prisma = new PrismaClient();

export const squiggleLinker: SqLinker = {
  resolve(name) {
    return name;
  },
  async loadSource(sourceId: string) {
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
      return content.code;
    } else {
      throw new NotFoundError();
    }
  },
};

export async function runSquiggle(
  currentRevisionId: string,
  code: string,
  seed: string
): Promise<string | undefined> {
  const env = {
    sampleCount: SAMPLE_COUNT_DEFAULT,
    xyPointLength: XY_POINT_LENGTH_DEFAULT,
    seed,
  };

  const project = SqProject.create({
    linker: squiggleLinker,
    environment: env,
  });

  project.setSource(SOURCE_NAME, code);
  await project.run(SOURCE_NAME);

  const outputR = project.getOutput(SOURCE_NAME);

  if (outputR.ok) {
    const _exports: ModelExport[] = outputR.value.exports
      .entries()
      .map((e) => ({
        variableName: e[0],
        variableType: e[1].tag,
        title: e[1].tags.name() ? e[1].tags.name() : e[1].title() || "",
        docstring: e[1].tags.doc() || "",
      }));

    for (const e of _exports) {
      await prisma.modelExport.upsert({
        where: {
          uniqueKey: {
            modelRevisionId: currentRevisionId,
            variableName: e.variableName,
          },
        },
        update: {
          variableType: e.variableType,
          title: e.title,
          docstring: e.docstring,
        },
        create: {
          modelRevision: { connect: { id: currentRevisionId } },
          variableName: e.variableName,
          variableType: e.variableType,
          title: e.title,
          docstring: e.docstring,
        },
      });
    }
  }

  return outputR.ok ? undefined : outputR.value.toString();
}

async function oldestModelRevisionWithoutBuilds() {
  const modelRevision = await prisma.modelRevision.findFirst({
    where: {
      currentRevisionModel: {
        isNot: null,
      },
      builds: {
        none: {},
      },
      contentType: "SquiggleSnippet",
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      model: {
        include: {
          currentRevision: {
            include: {
              squiggleSnippet: true,
            },
          },
        },
      },
    },
  });
  return modelRevision?.model;
}

async function buildRecentModelVersion() {
  try {
    const model = await oldestModelRevisionWithoutBuilds();

    if (!model) {
      console.log("No remaining unbuilt model revisions");
      return;
    }

    if (!model?.currentRevisionId || !model.currentRevision?.squiggleSnippet) {
      throw new NotFoundError(
        `Unexpected Error: Model revision didn't have needed information. This should never happen.`
      );
    }

    const { code, seed } = model.currentRevision.squiggleSnippet;

    const startTime = performance.now();

    let response = await runSquiggle(model.currentRevisionId, code, seed);

    const endTime = performance.now();
    const diff = endTime - startTime;

    const build = await prisma.modelRevisionBuild.create({
      data: {
        modelRevision: { connect: { id: model.currentRevisionId } },
        runSeconds: diff / 1000,
        errors: response === undefined ? [] : [response],
      },
    });

    console.log("Build complete:", build);
    console.log("Runtime:", diff);
    console.log("Response:", response);
  } catch (error) {
    console.error(error);
  }
}

async function countItemsRemaining() {
  const remaining = await prisma.modelRevision.count({
    where: {
      currentRevisionModel: {
        isNot: null,
      },
      builds: {
        none: {},
      },
    },
  });

  console.log("Model Revisions Remaining:", remaining);
}

async function main() {
  try {
    buildRecentModelVersion();
    countItemsRemaining();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

try {
  main();
} catch (error) {
  console.error("An unhandled error occurred:", error);
  process.exit(1);
}
