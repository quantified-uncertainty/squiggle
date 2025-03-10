import { getPrismaClient } from "@quri/hub-db";

const prisma = getPrismaClient();

async function main() {
  const specListExists = await prisma.specList.findFirst({
    where: {
      name: "Test Spec List",
    },
  });

  if (!specListExists) {
    await prisma.specList.create({
      data: {
        name: "Test Spec List",
        specs: {
          create: [
            { spec: { create: { description: "2+2" } } },
            {
              spec: {
                create: {
                  description: "How many piano tuners are there in the world?",
                },
              },
            },
            {
              spec: {
                create: { description: "How many people were ever alive?" },
              },
            },
          ],
        },
      },
    });
  }

  let ozzieUser = await prisma.user.findFirst({
    where: {
      asOwner: {
        slug: "ozziegooen",
      },
    },
  });

  if (!ozzieUser) {
    ozzieUser = await prisma.user.create({
      data: {
        asOwner: {
          create: { slug: "ozziegooen" },
        },
      },
    });
  }

  const sTestModel = await prisma.model.findFirst({
    where: {
      slug: "sTest",
      owner: {
        slug: "ozziegooen",
      },
    },
  });

  if (!sTestModel) {
    const model = await prisma.model.create({
      data: { slug: "sTest", owner: { connect: { slug: "ozziegooen" } } },
    });
    const revision = await prisma.modelRevision.create({
      data: {
        squiggleSnippet: {
          create: {
            code: "2+2", // TODO
            version: "dev",
            seed: "stest",
          },
        },
        author: {
          connect: { id: ozzieUser.id },
        },
        contentType: "SquiggleSnippet",
        model: {
          connect: {
            id: model.id,
          },
        },
      },
    });
    await prisma.model.update({
      where: { id: model.id },
      data: { currentRevisionId: revision.id },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
