import { Metadata } from "next";
import { PropsWithChildren } from "react";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { DefinitionLayout } from "./DefinitionLayout";

import QueryNode, {
  DefinitionLayoutQuery,
} from "@/__generated__/DefinitionLayoutQuery.graphql";

type Props = PropsWithChildren<{
  params: Promise<{ owner: string; slug: string }>;
}>;

export default async function Layout({ params, children }: Props) {
  const { owner, slug } = await params;
  const query = await loadPageQuery<DefinitionLayoutQuery>(QueryNode, {
    input: { owner, slug },
  });
  return <DefinitionLayout queryRef={query}>{children}</DefinitionLayout>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, slug } = await params;
  return { title: `${owner}/${slug}` };
}
