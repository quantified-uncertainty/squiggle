import { builder } from "@/graphql/builder";
import { decodeGlobalID } from "@pothos/plugin-relay";
import { ModelRevision, ModelRevisionConnection } from "./ModelRevision";

import { prisma } from "@/prisma";
import { Prisma, type Model as PrismaModel } from "@prisma/client";
import { Session } from "next-auth";
import { Owner, ValidatedOwnerInput } from "./Owner";

export function modelWhereHasAccess(
  session: Session | null
): Prisma.ModelWhereInput {
  return {
    OR: [
      { isPrivate: false },
      ...(session
        ? [
            {
              user: {
                email: session.user.email,
              },
            },
          ]
        : []),
      {
        group: {
          memberships: {
            some: {
              user: {
                email: session?.user.email,
              },
            },
          },
        },
      },
    ],
  };
}

export async function getWriteableModel({
  session,
  owner,
  slug,
}: {
  session: Session;
  owner: ValidatedOwnerInput;
  slug: string;
}): Promise<PrismaModel> {
  // Note: `findUnique` would be safer, but then we won't be able to use nested queries
  const model = await prisma.model.findFirst({
    where: {
      slug,
      ...(owner.type === "User"
        ? {
            user: {
              username: owner.name,
            },
          }
        : owner.type === "Group"
        ? {
            group: {
              slug: owner.name,
            },
          }
        : ({} as never)),
      OR: [
        {
          user: {
            email: session.user.email,
          },
        },
        {
          group: {
            memberships: {
              some: {
                user: {
                  email: session?.user.email,
                },
              },
            },
          },
        },
      ],
    },
  });
  if (!model) {
    throw new Error("Can't find model"); // FIXME - this will happen if permissions are not sufficient
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
      $any: {
        ...(model.userId && { userId: model.userId }),
        ...(model.groupId && { memberOfGroup: model.groupId }),
      },
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
      select: {
        user: true,
        group: true,
      },
      resolve: (model) => {
        const result = model.user ?? model.group;
        if (!result) {
          throw new Error(
            "Invalid model, one of `user` and `group` must be set"
          );
        }
        return result;
      },
    }),
    isPrivate: t.exposeBoolean("isPrivate"),
    isEditable: t.boolean({
      authScopes: (model) => ({
        $any: {
          ...(model.userId && { userId: model.userId }),
          ...(model.groupId && { memberOfGroup: model.groupId }),
        },
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
