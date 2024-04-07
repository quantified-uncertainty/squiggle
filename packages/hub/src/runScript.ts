import { Prisma, PrismaClient } from "@prisma/client";

import { ASTNode, SqLinker, SqProject, SqValue } from "@quri/squiggle-lang";

import { DEFAULT_SEED } from "@/constants";

import { ModelExport } from "../../components/dist/src/components/SquigglePlayground";
import { NotFoundError } from "./graphql/errors/NotFoundError";
import { parseSourceId } from "./squiggle/components/linker";

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

function getExportedVariables(ast: ASTNode): string[] {
  const exportedVariables: string[] = [];

  if (ast.type === "Program") {
    ast.statements.forEach((statement) => {
      if (statement.type === "LetStatement" && statement.exported) {
        exportedVariables.push(statement.variable.value);
      } else if (statement.type === "DefunStatement" && statement.exported) {
        exportedVariables.push(statement.variable.value);
      }
    });
  }

  return exportedVariables;
}

export async function runSquiggle2(
  currentRevisionId: string,
  code: string
): Promise<SquiggleOutput> {
  const MAIN = "main";

  const env = {
    sampleCount: 10000, // int
    xyPointLength: 10000, // int
    seed: DEFAULT_SEED,
  };

  const project = SqProject.create({
    linker: squiggleLinker,
  });

  project.setSource(MAIN, code);
  await project.run(MAIN);

  const outputR = project.getOutput(MAIN);
  // const foo = project.

  if (outputR.ok) {
    const ast = outputR.value.bindings.context?.ast;
    console.log("AST", ast && getExportedVariables(ast));
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

async function main(ownerSlug: string, slug: string) {
  const model = await prisma.model.findFirst({
    where: {
      slug,
      owner: { slug: ownerSlug },
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
  if (!model?.currentRevisionId || !firstCode) {
    throw new Error(`No code found for model ${ownerSlug}/${slug}`);
  }

  const startTime = performance.now();
  let response = await runSquiggle2(model?.currentRevisionId, firstCode);
  const endTime = performance.now();
  const diff = endTime - startTime;

  const build = await prisma.modelRevisionBuild.create({
    data: {
      modelRevision: { connect: { id: model.currentRevisionId } },
      runtime: diff,
      errors: response.isOk ? [] : [response.errorString],
    },
  });

  console.log("built", build, firstCode, diff, response);
}

main("ozzie", "test-model")
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
