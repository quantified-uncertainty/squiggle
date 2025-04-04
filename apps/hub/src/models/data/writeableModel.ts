import { ActionError } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";

import { modelWhereCanRead, modelWhereCanWrite } from "../authHelpers";

// Minimal shape - this DTO is only used in server actions.
type WriteableModelDTO = {
  id: string;
  slug: string;
};

export async function loadWriteableModel({
  owner,
  slug,
}: {
  owner: string;
  slug: string;
}): Promise<WriteableModelDTO> {
  // `findUnique` would be more idiomatic, but then we won't be able to use nested queries.
  const model = await prisma.model.findFirst({
    where: await modelWhereCanWrite({
      slug,
      owner: {
        slug: owner,
      },
    }),
    select: {
      id: true,
      slug: true,
    },
  });

  if (!model) {
    // we're going to fail, but how?

    // does the model exist?
    const modelExists = !!(await prisma.model.findFirst({
      select: {
        id: true,
      },
      where: await modelWhereCanRead({
        slug,
        owner: {
          slug: owner,
        },
      }),
    }));

    if (modelExists) {
      throw new ActionError("Can't edit model");
    } else {
      throw new ActionError("Can't find model");
    }
  }

  return model;
}
