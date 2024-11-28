"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/prisma";

const schema = z.object({
  username: z.string().min(1),
});

type SetUsernameResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export async function setUsername(
  formData: unknown
): Promise<SetUsernameResult> {
  const session = await auth();
  if (!session?.user.email) {
    throw new Error("Not signed in");
  }
  if (session.user.username) {
    return { ok: false, error: "Username is already set" };
  }

  const args = schema.parse(formData);

  const existingOwner = await prisma.owner.count({
    where: { slug: args.username },
  });
  if (existingOwner) {
    return { ok: false, error: `Username ${args.username} is not available` };
  }

  await prisma.user.update({
    where: {
      email: session.user.email,
    },
    data: {
      asOwner: {
        create: { slug: args.username },
      },
    },
  });

  return { ok: true };
}
