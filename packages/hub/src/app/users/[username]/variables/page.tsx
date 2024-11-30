import { Metadata } from "next";

import { VariableList } from "@/variables/components/VariableList";
import { loadVariableCards } from "@/variables/data/variableCards";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function OuterUserVariablesPage({ params }: Props) {
  const { username } = await params;
  const variables = await loadVariableCards({ ownerSlug: username });

  return <VariableList page={variables} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
