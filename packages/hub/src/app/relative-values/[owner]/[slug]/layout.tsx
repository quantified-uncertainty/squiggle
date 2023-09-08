import { Metadata } from "next";
import { PropsWithChildren } from "react";

import { DefinitionLayout } from "./DefinitionLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";
import QueryNode, {
  DefinitionLayoutQuery,
} from "@/__generated__/DefinitionLayoutQuery.graphql";

type Props = PropsWithChildren<{
  params: { owner: string; slug: string };
}>;

export default async function Layout({ params, children }: Props) {
  const query = await loadPageQuery<DefinitionLayoutQuery>(QueryNode, {
    input: { owner: params.owner, slug: params.slug },
  });
  return <DefinitionLayout queryRef={query}>{children}</DefinitionLayout>;
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: `${params.owner}/${params.slug}` };
}
