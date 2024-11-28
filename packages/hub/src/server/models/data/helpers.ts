import { auth } from "@/auth";
import { prisma } from "@/prisma";

import { ModelCardDTO } from "./card";

export async function isModelEditable(model: ModelCardDTO): Promise<boolean> {
  const session = await auth();
  if (!session?.user.email) {
    return false;
  }

  return Boolean(
    await prisma.owner.count({
      where: {
        id: model.owner.id,
        OR: [
          {
            user: { email: session.user.email },
          },
          {
            group: {
              memberships: {
                some: {
                  user: {
                    email: session.user.email,
                  },
                },
              },
            },
          },
        ],
      },
    })
  );
}
