import { notFound } from "next/navigation";

import { Button } from "@quri/ui";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { H2 } from "@/components/ui/Headers";
import { resetPrisma } from "@/prisma";

export default async function () {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  async function disablePrismaLogs() {
    "use server";
    await resetPrisma({ logs: "none" });
  }

  async function enablePrismaLogs() {
    "use server";
    await resetPrisma({ logs: "query" });
  }

  return (
    <NarrowPageLayout>
      <div className="space-y-4">
        <H2>Prisma logs</H2>
        <div>
          These buttons will enable/disable console logs from Prisma.
          <br />
          Logs are on by default in dev mode, but you might want to disable them
          if you have other logs.
        </div>
        <form action={disablePrismaLogs}>
          <Button type="submit">Disable Prisma logs</Button>
        </form>
        <form action={enablePrismaLogs}>
          <Button type="submit">Enable Prisma logs</Button>
        </form>
      </div>
    </NarrowPageLayout>
  );
}
