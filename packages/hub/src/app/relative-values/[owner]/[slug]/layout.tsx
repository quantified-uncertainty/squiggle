import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropsWithChildren } from "react";

import { controlsOwnerId } from "@/server/owners/auth";
import { loadRelativeValuesDefinitionCard } from "@/server/relative-values/data/cards";

import { DefinitionLayout } from "./DefinitionLayout";

type Props = PropsWithChildren<{
  params: Promise<{ owner: string; slug: string }>;
}>;

export default async function Layout({ params, children }: Props) {
  const { owner, slug } = await params;
  const definition = await loadRelativeValuesDefinitionCard({ owner, slug });

  if (!definition) {
    notFound();
  }

  const isEditable = await controlsOwnerId(definition.owner.id);
  return (
    <DefinitionLayout definition={definition} isEditable={isEditable}>
      {children}
    </DefinitionLayout>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, slug } = await params;
  return { title: `${owner}/${slug}` };
}
