import { UnionRef } from "@pothos/core";

import { ASTNode, parse } from "@quri/squiggle-lang";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";

import { NotFoundError } from "../errors/NotFoundError";
import { ModelRevisionBuild } from "./ModelRevisionBuild";
import { RelativeValuesExport } from "./RelativeValuesExport";
import { SquiggleSnippet } from "./SquiggleSnippet";

// TODO - turn into interface?
const ModelContent: UnionRef<
  {
    id: string;
    code: string;
    version: string;
  },
  {
    id: string;
    code: string;
    version: string;
  }
> = builder.unionType("ModelContent", {
  types: [SquiggleSnippet],
  resolveType: () => SquiggleSnippet,
});

const ModelRevisionBuildStatus = builder.enumType("ModelRevisionBuildStatus", {
  values: ["Skipped", "Pending", "Success", "Failure"],
});

function astToVariableNames(ast: ASTNode): string[] {
  const exportedVariableNames: string[] = [];

  if (ast.type === "Program") {
    ast.statements.forEach((statement) => {
      while (statement.type === "DecoratedStatement")
        statement = statement.statement;
      if (statement.type === "LetStatement" && statement.exported) {
        exportedVariableNames.push(statement.variable.value);
      } else if (statement.type === "DefunStatement" && statement.exported) {
        exportedVariableNames.push(statement.variable.value);
      }
    });
  }

  return exportedVariableNames;
}

export function getExportedVariableNames(code: string): string[] {
  const ast = parse(code);
  if (ast.ok) {
    return astToVariableNames(ast.value);
  } else {
    return [];
  }
}

export const ModelRevision = builder.prismaNode("ModelRevision", {
  id: { field: "id" },

  include: { model: true },
  authScopes: (revision) => {
    if (!revision.model.isPrivate) {
      return true;
    }
    return { controlsOwnerId: revision.model.ownerId };
  },

  fields: (t) => ({
    createdAtTimestamp: t.float({
      resolve: (revision) => revision.createdAt.getTime(),
    }),
    // `relatedConnection` would be more principled, and in theory the number of variables with definitions could be high.
    // But connection is harder to deal with on the UI side, and since we send all variables back on updates, so it doesn't make much sense there.
    relativeValuesExports: t.relation("relativeValuesExports"),
    variableRevisions: t.relation("variableRevisions"),
    model: t.relation("model"),

    lastBuild: t.field({
      type: ModelRevisionBuild,
      nullable: true,
      select: {
        builds: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      async resolve(revision) {
        return revision.builds[0];
      },
    }),
    author: t.relation("author", { nullable: true }),
    comment: t.exposeString("comment"),
    buildStatus: t.field({
      type: ModelRevisionBuildStatus,
      select: {
        builds: {
          select: {
            errors: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        model: {
          select: {
            currentRevisionId: true,
          },
        },
      },
      async resolve(revision) {
        const lastBuild = revision.builds[0];

        if (lastBuild) {
          return lastBuild.errors.length === 0 ? "Success" : "Failure";
        }

        return revision.model.currentRevisionId === revision.id
          ? "Pending"
          : "Skipped";
      },
    }),
    content: t.field({
      type: ModelContent,
      select: { squiggleSnippet: true },
      async resolve(revision) {
        switch (revision.contentType) {
          case "SquiggleSnippet":
            return revision.squiggleSnippet!;
        }
      },
    }),
    exportNames: t.field({
      type: ["String"],
      select: { squiggleSnippet: true },
      async resolve(revision) {
        if (revision.contentType === "SquiggleSnippet") {
          return getExportedVariableNames(revision.squiggleSnippet!.code);
        } else {
          return [];
        }
      },
    }),
    forRelativeValues: t.fieldWithInput({
      type: RelativeValuesExport,
      errors: {
        types: [NotFoundError],
      },
      input: {
        variableName: t.input.string({ required: true }),
        // optional, necessary if the variable is associated with multiple definitions
        for: t.input.field({
          type: builder.inputType(
            "ModelRevisionForRelativeValuesSlugOwnerInput",
            {
              fields: (t) => ({
                slug: t.string({ required: true }),
                owner: t.string({ required: true }),
              }),
            }
          ),
        }),
      },
      async resolve(revision, { input }) {
        const exports = await prisma.relativeValuesExport.findMany({
          where: {
            modelRevisionId: revision.id,
            variableName: input.variableName,
            ...(input.for
              ? {
                  definition: {
                    owner: { slug: input.for.owner },
                    slug: input.for.slug,
                  },
                }
              : {}),
          },
          include: {
            definition: true,
          },
        });

        if (exports.length > 1) {
          throw new Error("Ambiguous input, multiple variables match it");
        }

        if (exports.length === 0) {
          throw new NotFoundError();
        }

        return exports[0];
      },
    }),
  }),
});

export const ModelRevisionConnection = builder.connectionObject({
  type: ModelRevision,
  name: "ModelRevisionConnection",
});
