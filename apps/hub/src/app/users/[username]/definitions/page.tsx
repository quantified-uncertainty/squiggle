import { Metadata } from "next";

import { RelativeValuesDefinitionList } from "@/relative-values/components/RelativeValuesDefinitionList";
import { loadDefinitionCards } from "@/relative-values/data/cards";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function UserDefinitionsPage({ params }: Props) {
  const { username } = await params;
  const page = await loadDefinitionCards({
    username,
  });

  return <RelativeValuesDefinitionList page={page} showOwner={false} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
