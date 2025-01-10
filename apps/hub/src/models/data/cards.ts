import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";
import { selectTypedOwner, toTypedOwnerDTO } from "@/owners/data/typedOwner";

import { modelWhereHasAccess } from "./authHelpers";

// FIXME - explicit ModelCardDTO
function toDTO(dbModel: DbModelCard) {
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

  return {
    // FIXME - process each field separately
    ...dbModel,
    owner: toTypedOwnerDTO(dbModel.owner),
  };
}

const select = {
  id: true,
  slug: true,
  updatedAt: true,
  owner: {
    select: selectTypedOwner,
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
      id: true,
      contentType: true,
      squiggleSnippet: {
        select: {
          id: true,
          code: true,
          version: true,
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
          // be careful with selecting errors here - potential security risk, build script doesn't take `isPrivate` into account
          runSeconds: true,
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
  Awaited<ReturnType<typeof prisma.model.findFirst<{ select: typeof select }>>>
>;

export type ModelCardDTO = ReturnType<typeof toDTO>;

export async function loadModelCards(
  params: {
    ownerSlug?: string;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<Paginated<ModelCardDTO>> {
  const limit = params.limit ?? 20;

  const dbModels = await prisma.model.findMany({
    select,
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

  const models = dbModels.map(toDTO);

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
}): Promise<ModelCardDTO | null> {
  const dbModel = await prisma.model.findFirst({
    select: select,
    where: {
      slug,
      owner: { slug: owner },
      OR: await modelWhereHasAccess(),
    },
  });

  if (!dbModel) {
    return null;
  }

  return toDTO(dbModel);
}
