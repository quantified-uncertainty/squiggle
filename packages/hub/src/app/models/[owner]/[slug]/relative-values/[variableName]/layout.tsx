import { PropsWithChildren } from "react";

import { loadPageQuery } from "@/relay/loadPageQuery";

import { RelativeValuesModelLayout } from "./RelativeValuesModelLayout";

import QueryNode, {
  RelativeValuesModelLayoutQuery,
} from "@/__generated__/RelativeValuesModelLayoutQuery.graphql";

export default async function Layout({
  params,
  children,
}: PropsWithChildren<{
  params: Promise<{ owner: string; slug: string; variableName: string }>;
}>) {
  const { owner, slug, variableName } = await params;
  const query = await loadPageQuery<RelativeValuesModelLayoutQuery>(QueryNode, {
    input: {
      owner,
      slug,
    },
    forRelativeValues: {
      variableName,
    },
  });

  return (
    <RelativeValuesModelLayout query={query} variableName={variableName}>
      {children}
    </RelativeValuesModelLayout>
  );
}
