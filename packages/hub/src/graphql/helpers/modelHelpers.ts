import { Model, Prisma } from "@prisma/client";
import { Session } from "next-auth";

import { prisma } from "@/prisma";

export async function getWriteableModel({
  session,
  owner,
  slug,
  include,
}: {
  session: Session; // FIXME - SignedInSession?
  owner: string;
  slug: string;
  include?: Prisma.ModelInclude;
}): Promise<Model> {
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
    // this might happen if permissions are not sufficient
    throw new Error("Can't find model");
  }
  return model;
}
