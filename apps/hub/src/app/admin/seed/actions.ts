"use server";

import { hubApi } from "@quri/hub-api-client";

import { actionClient } from "@/lib/server/actionClient";
import { prisma } from "@/lib/server/prisma";

export const seedDatabase = actionClient.action(async () => {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Seeding is only allowed in development mode");
  }

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
    const code = await hubApi.getModelCode("ozziegooen", "sTest");
    const model = await prisma.model.create({
      data: { slug: "sTest", owner: { connect: { slug: "ozziegooen" } } },
    });
    const revision = await prisma.modelRevision.create({
      data: {
        squiggleSnippet: {
          create: {
            code,
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
});
