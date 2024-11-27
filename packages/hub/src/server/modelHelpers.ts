import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/prisma";

function ownerToGraphqlCompatible(owner: {
  slug: string;
  user: { id: string } | null;
  group: { id: string } | null;
}) {
  const __typename = owner.user ? "User" : "Group";
  return { slug: owner.slug, __typename };
}

export async function loadModelCards() {
  const limit = 20;
  const session = await auth();

  const dbModels = await prisma.model.findMany({
    select: {
      id: true,
      slug: true,
      updatedAt: true,
      owner: {
        select: {
          slug: true,
          user: {
            select: { id: true },
          },
          group: {
            select: { id: true },
          },
        },
      },
      isPrivate: true,
      variables: {
        select: {
          variableName: true,
          currentRevision: {
            select: {
              variableType: true,
              title: true,
            },
          },
        },
      },
      currentRevision: {
        select: {
          contentType: true,
          squiggleSnippet: {
            select: {
              id: true,
              code: true,
            },
          },
          relativeValuesExports: {
            select: {
              variableName: true,
              definition: {
                select: {
                  slug: true,
                },
              },
            },
          },
          builds: {
            select: {
              runSeconds: true,
              errors: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    where: {
      OR: [
        { isPrivate: false },
        ...(session
          ? [
              {
                owner: {
                  user: { email: session.user.email },
                },
              },
              {
                owner: {
                  group: {
                    memberships: {
                      some: {
                        user: { email: session.user.email },
                      },
                    },
                  },
                },
              },
            ]
          : []),
      ],
    },
    take: limit + 1,
  });

  type DbModel = (typeof dbModels)[number];

  const models = dbModels
    .filter(
      (
        model
      ): model is Omit<DbModel, "currentRevision"> & {
        currentRevision: NonNullable<DbModel["currentRevision"]>;
      } => !!model.currentRevision
    )
    .map((model) => ({
      ...model,
      owner: ownerToGraphqlCompatible(model.owner),
    }));

  return {
    models: limit ? models.slice(0, limit) : models,
    hasMore: limit ? models.length > limit : false,
  };
}

export type ModelCardData = Awaited<
  ReturnType<typeof loadModelCards>
>["models"][number];
