import "dotenv/config";

import inquirer from "inquirer";

import { PrismaClient } from "@quri/hub-db";

const prisma = new PrismaClient();

async function addSpec(): Promise<string> {
  const { description } = await inquirer.prompt([
    {
      type: "input",
      name: "description",
      message: "Enter spec description:",
      validate: (input) => {
        if (input.trim() === "") {
          return "Description cannot be empty";
        }
        return true;
      },
    },
  ]);

  const spec = await prisma.spec.create({
    data: {
      description,
    },
  });

  console.log(`Added spec: ${spec.id}`);
  return spec.id;
}

async function addSpecList() {
  console.log("Creating a new SpecList");

  const specIds: string[] = [];
  let addingSpecs = true;

  while (addingSpecs) {
    const specId = await addSpec();
    specIds.push(specId);

    const { addAnother } = await inquirer.prompt([
      {
        type: "confirm",
        name: "addAnother",
        message: "Add another spec?",
        default: true,
      },
    ]);

    addingSpecs = addAnother;
  }

  const specList = await prisma.specList.create({
    data: {
      specs: {
        create: specIds.map((specId) => ({
          spec: {
            connect: {
              id: specId,
            },
          },
        })),
      },
    },
    include: {
      specs: {
        include: {
          spec: true,
        },
      },
    },
  });

  console.log("\nCreated SpecList:");
  console.log(`ID: ${specList.id}`);
  console.log("Specs:");
  for (const specOnList of specList.specs) {
    console.log(`- ${specOnList.spec.description} (${specOnList.spec.id})`);
  }
}

async function main() {
  try {
    await addSpecList();
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
