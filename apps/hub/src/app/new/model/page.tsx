import { Metadata } from "next";
import { z } from "zod";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { getMyGroup } from "@/groups/data/groupCards";
import { getSessionOrRedirect } from "@/users/auth";

import { NewModel } from "./NewModel";

export default async function NewModelPage({
  searchParams,
}: {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}) {
  await getSessionOrRedirect();

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
