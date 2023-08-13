import { builder } from "@/graphql/builder";
import { ModelRevision, ModelRevisionConnection } from "./ModelRevision";
import { decodeGlobalID } from "@pothos/plugin-relay";

import { Session } from "next-auth";
import { Prisma } from "@prisma/client";

export function modelWhereHasAccess(
  session: Session | null
): Prisma.ModelWhereInput {
  return {
    OR: [
      { isPrivate: false },
      ...(session
        ? [
            {
              owner: {
                email: session.user.email,
              },
            },
          ]
        : []),
    ],
  };
}

export const Model = builder.prismaNode("Model", {
  id: { field: "id" },
  include: {
    owner: true, // required for auth
  },
  authScopes: (model, context) => {
    if (!model.isPrivate || context.session?.user.email === model.owner.email) {
      return true;
    }
    // This might leak the info that the model exists, but we handle that in `model()` query and return NotFoundError.
    // It's still possible that we leak this info somewhere else, though.
    return false;
  },
  fields: (t) => ({
    slug: t.exposeString("slug"),
    // I'm not yet sure if we'll use custom scalars for datetime encoding, so `createdAtTimestamp` is a precaution; we'll probably switch to `createAt` in the future
    createdAtTimestamp: t.float({
      resolve: (model) => model.createdAt.getTime(),
    }),
    updatedAtTimestamp: t.float({
      resolve: (model) => model.updatedAt.getTime(),
    }),
    owner: t.relation("owner"),
    isPrivate: t.exposeBoolean("isPrivate"),
    currentRevision: t.relation("currentRevision", {
      nullable: false,
    }),
    revision: t.field({
      type: ModelRevision,
      args: {
        id: t.arg.id({ required: true }),
      },
      select: (args, _, nestedSelection) => {
        const { typename, id } = decodeGlobalID(String(args.id));
        if (typename !== "ModelRevision") {
          throw new Error("Expected ModelRevision id");
        }

        return {
          revisions: nestedSelection({
            take: 1,
            where: { id },
          }),
        };
      },
      async resolve(model) {
        const revision = model.revisions[0];
        if (!revision) {
          throw new Error("Not found");
        }
        return revision;
      },
    }),
    revisions: t.relatedConnection(
      "revisions",
      {
        cursor: "id",
        query: () => ({
          orderBy: {
            createdAt: "desc",
          },
        }),
      },
      ModelRevisionConnection
    ),
  }),
});

export const ModelConnection = builder.connectionObject({
  type: Model,
  name: "ModelConnection",
});
