import { PrismaClient } from "@prisma/client";

import { runSquiggle } from "@/graphql/queries/runSquiggle";
import { ModelExport } from "@/lib/ExportsDropdown";

const prisma = new PrismaClient();

export async function runSquiggleCode(
  currentRevisionId: string,
  code: string,
  seed: string
): Promise<string | undefined> {
  const outputR = await runSquiggle(code, seed);

  if (outputR.ok) {
    // I Imagine it would be nice to move this out of this worker file, but this would require exporting a lot more information. It seems wise to instead wait for the Serialization PR to go in and then refactor this.
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

type RunMessage = {
  type: "run";
  data: {
    revisionId: string;
    code: string;
    seed: string;
  };
};

process.on("message", async (message: RunMessage) => {
  if (message.type === "run") {
    try {
      const { revisionId, code, seed } = message.data;
      const errors = await runSquiggleCode(revisionId, code, seed);
      process?.send?.({
        type: "result",
        data: {
          errors,
        },
      });
    } catch (error) {
      console.error("An error occurred in the worker process:", error);
      process?.send?.({
        type: "result",
        data: {
          errors: "An unknown error occurred in the worker process.",
        },
      });
    } finally {
      await prisma.$disconnect();
      process.exit(1);
    }
  }
});
