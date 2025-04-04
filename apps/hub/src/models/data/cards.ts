import { Prisma } from "@quri/hub-db";

import { findPaginated, makePaginated } from "@/lib/server/dataHelpers";
import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";
import { OwnerDTO, selectOwner, toOwnerDTO } from "@/owners/data/owner";

import { modelWhereCanRead } from "../authHelpers";
import { ModelRevisionBuildDTO, selectModelRevisionBuild } from "./builds";

const select = {
  id: true,
  slug: true,
  updatedAt: true,
  owner: {
    select: selectOwner,
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
        select: selectModelRevisionBuild,
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  },
} satisfies Prisma.ModelSelect;

function toDTO(dbModel: Row): ModelCardDTO {
  function check(model: Row): asserts model is Row & {
    currentRevision: NonNullable<Row["currentRevision"]>;
  } {
    if (!model.currentRevision) {
      throw new Error("Model has no current revision");
    }
  }
  check(dbModel);

  return {
    id: dbModel.id,
    slug: dbModel.slug,
    updatedAt: dbModel.updatedAt,
    owner: toOwnerDTO(dbModel.owner),
    isPrivate: dbModel.isPrivate,
    variables: dbModel.variables,
    currentRevision: dbModel.currentRevision,
  };
}

type Row = NonNullable<
  Awaited<ReturnType<typeof prisma.model.findFirst<{ select: typeof select }>>>
>;

export type ModelCardDTO = {
  id: string;
  slug: string;
  updatedAt: Date;
  owner: OwnerDTO;
  isPrivate: boolean;
  variables: {
    variableName: string;
    currentRevision: {
      variableType: string;
      title: string | null;
    } | null;
  }[];
  currentRevision: {
    id: string;
    contentType: string;
    squiggleSnippet: {
      id: string;
      code: string;
      version: string;
    } | null;
    relativeValuesExports: {
      variableName: string;
      definition: {
        slug: string;
      };
    }[];
    builds: ModelRevisionBuildDTO[];
  };
};

export async function loadModelCards({
  limit = 20,
  cursor,
  ...params
}: {
  limit?: number;
  cursor?: string;
  ownerSlug?: string;
} = {}): Promise<Paginated<ModelCardDTO>> {
  const rows = await prisma.model.findMany({
    select,
    where: await modelWhereCanRead(
      params.ownerSlug
        ? {
            owner: {
              slug: params.ownerSlug,
            },
          }
        : {}
    ),
    orderBy: { updatedAt: "desc" },
    ...findPaginated(cursor, limit),
  });

  const models = rows.map(toDTO);

  const nextCursor = models[models.length - 1]?.id;
  async function loadMore(limit: number) {
    "use server";
    return loadModelCards({ ...params, cursor: nextCursor, limit });
  }

  return makePaginated(models, limit, loadMore);
}

export async function loadModelCard({
  owner,
  slug,
}: {
  owner: string;
  slug: string;
}): Promise<ModelCardDTO | null> {
  const row = await prisma.model.findFirst({
    select,
    where: await modelWhereCanRead({
      slug,
      owner: { slug: owner },
    }),
  });

  if (!row) {
    return null;
  }

  return toDTO(row);
}
