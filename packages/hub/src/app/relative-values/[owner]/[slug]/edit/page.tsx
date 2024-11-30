import { notFound } from "next/navigation";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { controlsOwnerId } from "@/owners/data/auth";
import { loadRelativeValuesDefinitionFull } from "@/relative-values/data/full";
import { getSessionUserOrRedirect } from "@/users/auth";

import { EditRelativeValuesDefinition } from "./EditRelativeValuesDefinition";

type Props = {
  params: Promise<{ owner: string; slug: string }>;
};

export default async function Page({ params }: Props) {
  // if we're not signed in, we can't edit
  await getSessionUserOrRedirect();

  const { owner, slug } = await params;
  const definition = await loadRelativeValuesDefinitionFull({ owner, slug });
  if (!definition) {
    notFound();
  }

  if (!(await controlsOwnerId(definition.owner.id))) {
    throw new Error("Unauthorized");
  }

  return (
    <NarrowPageLayout>
      <EditRelativeValuesDefinition definition={definition} />
    </NarrowPageLayout>
  );
}
