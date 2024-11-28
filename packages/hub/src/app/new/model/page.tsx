import { Metadata } from "next";
import { z } from "zod";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { getMyGroup } from "@/server/groups/data/card";
import { getSessionUserOrRedirect } from "@/server/users/auth";

import { NewModel } from "./NewModel";

export default async function OuterNewModelPage({
  searchParams,
}: {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}) {
  await getSessionUserOrRedirect();

  const groupSlug = z
    .string()
    .optional()
    .parse((await searchParams)["group"]);

  const group = groupSlug ? await getMyGroup(groupSlug) : null;

  return (
    <NarrowPageLayout>
      <NewModel initialGroup={group} />
    </NarrowPageLayout>
  );
}

export const metadata: Metadata = {
  title: "New model",
};
