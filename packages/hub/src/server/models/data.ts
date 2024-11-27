import "server-only";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/prisma";

// duplicates code in graphql/helpers/modelHelpers.ts
export async function modelWhereHasAccess(): Promise<Prisma.ModelWhereInput[]> {
  const session = await auth();
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
  return orParts;
}

function dbModelToModelCard(dbModel: DbModelCard) {
  function check(model: DbModelCard): asserts model is Omit<
    DbModelCard,
    "currentRevision"
  > & {
    currentRevision: NonNullable<DbModelCard["currentRevision"]>;
  } {
    if (!model.currentRevision) {
      throw new Error("Model has no current revision");
    }
  }
  check(dbModel);

  const ownerToGraphqlCompatible = (owner: {
    slug: string;
    user: { id: string } | null;
    group: { id: string } | null;
  }) => {
    const __typename = owner.user ? "User" : "Group";
    return { slug: owner.slug, __typename };
  };

  return {
    ...dbModel,
    owner: ownerToGraphqlCompatible(dbModel.owner),
  };
}

const modelCardSelect = {
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
} satisfies Prisma.ModelSelect;

type DbModelCard = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.model.findFirst<{ select: typeof modelCardSelect }>
    >
  >
>;

export type ModelCardData = ReturnType<typeof dbModelToModelCard>;

export type Paginated<T> = {
  items: T[];
  loadMore?: (limit: number) => Promise<Paginated<T>>;
};

export async function loadModelCards(
  params: {
    ownerSlug?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<Paginated<ModelCardData>> {
  const limit = params.limit ?? 20;

  const dbModels = await prisma.model.findMany({
    select: modelCardSelect,
    orderBy: { updatedAt: "desc" },
    cursor: params.cursor ? { id: params.cursor } : undefined,
    where: {
      ...(params.ownerSlug
        ? {
            owner: {
              slug: params.ownerSlug,
            },
          }
        : {}),
      OR: await modelWhereHasAccess(),
    },
    take: limit + 1,
  });

  const models = dbModels.map(dbModelToModelCard);

  const nextCursor = models[models.length - 1]?.id;

  async function loadMore(limit: number) {
    "use server";
    return loadModelCards({ ...params, cursor: nextCursor, limit });
  }

  return {
    items: models.slice(0, limit),
    loadMore: models.length > limit ? loadMore : undefined,
  };
}

export async function loadModelCard({
  owner,
  slug,
}: {
  owner: string;
  slug: string;
}): Promise<ModelCardData | null> {
  const dbModel = await prisma.model.findFirst({
    select: modelCardSelect,
    where: {
      slug: slug,
      owner: { slug: owner },
      OR: await modelWhereHasAccess(),
    },
  });

  if (!dbModel) {
    return null;
  }

  return dbModelToModelCard(dbModel);
}
