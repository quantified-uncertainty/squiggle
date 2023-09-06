import { prisma } from "@/prisma";

if (!process.env["DATABASE_URL"]?.includes("quri-test")) {
  throw new Error("Expected quri-test database, probable misconfiguration");
}

beforeEach(async () => {
  await prisma.user.deleteMany();
  await prisma.group.deleteMany();
  // TODO - other models (but note that most would be removed by cascading from `user`)
});
