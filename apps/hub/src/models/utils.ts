import { Model, Prisma } from "@quri/hub-db";

import { ActionError } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";
import { getSessionOrRedirect } from "@/users/auth";

import { modelWhereHasAccess } from "./data/authHelpers";

export async function getWriteableModel({
  owner,
  slug,
  include,
}: {
  owner: string;
  slug: string;
  include?: Prisma.ModelInclude;
}): Promise<Model> {
  const session = await getSessionOrRedirect();

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
    include,
  });

  if (!model) {
    // we're going to fail, but how?

    // does the model exist?
    const modelExists = !!(await prisma.model.findFirst({
      select: {
        id: true,
      },
      where: {
        slug,
        owner: {
          slug: owner,
        },
        OR: await modelWhereHasAccess(),
      },
    }));

    if (modelExists) {
      throw new ActionError("Can't edit model");
    } else {
      throw new ActionError("Can't find model");
    }
  }

  return model;
}
