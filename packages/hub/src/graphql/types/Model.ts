import { Prisma, type Model as PrismaModel } from "@prisma/client";
import { Session } from "next-auth";

import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { NotFoundError } from "../errors/NotFoundError";
import { decodeGlobalIdWithTypename } from "../utils";
import { ModelRevision, ModelRevisionConnection } from "./ModelRevision";
import { Owner } from "./Owner";

export function modelWhereHasAccess(
  session: Session | null
): Prisma.ModelWhereInput {
  const orParts: Prisma.ModelWhereInput[] = [{ isPrivate: false }];
  if (session) {
    orParts.push({
      owner: {
        OR: [
          {
            user: { email: session.user.email },
          },
          {
            group: {
              memberships: {
                some: {
                  user: { email: session.user.email },
                },
              },
            },
          },
        ],
      },
    });
  }
  return { OR: orParts };
}

export async function getWriteableModel({
  session,
  owner,
  slug,
}: {
  session: Session;
  owner: string;
  slug: string;
}): Promise<PrismaModel> {
  // Note: `findUnique` would be safer, but then we won't be able to use nested queries
  const model = await prisma.model.findFirst({
    where: {
      slug,
      owner: {
        slug: owner,
        OR: [
          {
            user: { email: session.user.email },
          },
          {
            group: {
              memberships: {
                some: {
                  user: { email: session.user.email },
                },
              },
            },
          },
        ],
      },
    },
  });
  if (!model) {
    // FIXME - this will happen if permissions are not sufficient
    // It would be better to throw a custom PermissionError
    // (Note that we should throw PermissionError only if model is readable, but not writeable; otherwise it should still be "Can't find")
    throw new NotFoundError("Can't find model");
  }
  return model;
}

export const Model = builder.prismaNode("Model", {
  id: { field: "id" },
  authScopes: (model) => {
    if (!model.isPrivate) {
      return true;
    }

    // This might leak the info that the model exists, but we handle that in `model()` query and return NotFoundError.
    // It's probable that we leak this info somewhere else, though.
    return {
      controlsOwnerId: model.ownerId,
    };
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
    owner: t.field({
      type: Owner,
      // TODO - we need to extract fragment data from Owner query and call nestedSelection(...) for optimal performance.
      select: {
        owner: {
          include: {
            user: true,
            group: true,
          },
        },
      },
      resolve: (model) => {
        const result = model.owner.user ?? model.owner.group;
        // necessary for Owner type
        (result as any)["_owner"] = {
          type: model.owner.user ? "User" : "Group",
        };
        return result;
      },
    }),
    isPrivate: t.exposeBoolean("isPrivate"),
    isEditable: t.boolean({
      authScopes: (model) => ({
        controlsOwnerId: model.ownerId,
      }),
      resolve: () => true,
      unauthorizedResolver: () => false,
    }),
    currentRevision: t.relation("currentRevision", {
      nullable: false,
    }),
    revision: t.field({
      type: ModelRevision,
      args: {
        id: t.arg.id({ required: true }),
      },
      select: (args, _, nestedSelection) => {
        const id = decodeGlobalIdWithTypename(String(args.id), "ModelRevision");

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

export const modelConnectionHelpers = prismaConnectionHelpers(
  builder,
  "Model",
  { cursor: "id" }
);
