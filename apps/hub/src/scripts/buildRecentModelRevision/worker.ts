import { SquiggleVersion } from "@quri/versioned-squiggle-components";

import { setCliUserEmail } from "@/lib/server/cli";
import { prisma } from "@/lib/server/prisma";
import { runSquiggle } from "@/lib/server/runSquiggle";

export type VariableRevisionInput = {
  variableName: string;
  variableType: string;
  title?: string;
  docstring: string;
};

export type WorkerRunMessage = {
  type: "run";
  data: {
    userEmail?: string;
    code: string;
    seed: string;
    squiggleVersion: SquiggleVersion;
  };
};

export type WorkerOutput = {
  errors: string;
  variableRevisions?: VariableRevisionInput[];
};

export async function runSquiggleCode({
  code,
  seed,
  squiggleVersion,
}: {
  code: string;
  seed: string;
  squiggleVersion: SquiggleVersion;
}): Promise<WorkerOutput> {
  const { result } = await runSquiggle({ code, seed, squiggleVersion });

  let variableRevisions: VariableRevisionInput[] = [];

  if (result.ok) {
    // I Imagine it would be nice to move this out of this worker file, but this would require exporting a lot more information. It seems wise to instead wait for the Serialization PR to go in and then refactor this.
    variableRevisions = result.value.exports.entries().map((e) => ({
      variableName: e[0],
      variableType: e[1].tag,
      title: e[1].tags.name() ? e[1].tags.name() : e[1].title() || "",
      docstring: e[1].tags.doc() || "",
    }));
  }

  return {
    errors: result.ok ? "" : result.value.toString(),
    variableRevisions,
  };
}

// IMPORTANT: This is not threadsafe, because of `setCliUserEmail` that sets a global variable.
// Don't try to run multiple Squiggle models in parallel in a single worker, especially if they have different users.
process.on("message", async (message: WorkerRunMessage) => {
  if (message.type === "run") {
    try {
      const { code, seed, userEmail, squiggleVersion } = message.data;
      // This affects the behavior of the runSquiggle function - the linker checks permissions on imports.
      setCliUserEmail(userEmail);

      const buildOutput = await runSquiggleCode({
        code,
        seed,
        squiggleVersion,
      });
      process.send?.({
        type: "result",
        data: buildOutput,
      });
    } catch (error) {
      console.error("An error occurred in the worker process:", error);
      process.send?.({
        type: "result",
        data: {
          errors: "An unknown error occurred in the worker process.",
        } satisfies WorkerOutput,
      });
    } finally {
      await prisma.$disconnect();
      process.exit(0);
    }
  }
});
