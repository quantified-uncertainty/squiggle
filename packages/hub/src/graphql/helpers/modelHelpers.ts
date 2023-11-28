import { Model, Prisma } from "@prisma/client";
import { Session } from "next-auth";

import { prisma } from "@/prisma";
import { NotFoundError } from "../errors/NotFoundError";

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
  });
  if (!model) {
    // FIXME - this will happen if permissions are not sufficient
    // It would be better to throw a custom PermissionError
    // (Note that we should throw PermissionError only if model is readable, but not writeable; otherwise it should still be "Can't find")
    throw new NotFoundError("Can't find model");
  }
  return model;
}
