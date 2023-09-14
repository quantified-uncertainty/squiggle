// One-shot script, can be deleted later
import { prisma } from "./prisma";

async function main() {
  const users = await prisma.user.findMany({
    include: {
      models: {
        select: {
          id: true,
        },
      },
    },
  });
  for (const user of users) {
    if (!user.username) {
      continue;
    }
    const owner = await prisma.owner.upsert({
      where: {
        slug: user.username,
      },
      create: {
        slug: user.username,
      },
      update: {},
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { ownerId: owner.id },
    });

    for (const model of user.models) {
      await prisma.model.update({
        where: { id: model.id },
        data: { ownerId: owner.id },
      });
    }
  }
}

main();
