import { notFound } from "next/navigation";

import { Button } from "@quri/ui";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { H2 } from "@/components/ui/Headers";
import { resetPrisma } from "@/lib/server/prisma";

export default async function DevPage() {
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
          <p>These buttons will enable/disable console logs from Prisma.</p>
          <p>
            Logs are on by default in dev mode, but you might want to disable
            them if you have other logs.
          </p>
          <p>
            {
              "These buttons don't work immediately, seemingly because Next.js can have multiple processes or threads? But they do work eventually."
            }
          </p>
          <p>
            The state is not persisted between <code>next dev</code> runs.
          </p>
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
