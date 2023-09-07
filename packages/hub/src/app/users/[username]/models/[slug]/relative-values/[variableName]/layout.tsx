import { PropsWithChildren, ReactNode } from "react";

import { RelativeValuesModelLayout } from "./RelativeValuesModelLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";
import QueryNode, {
  RelativeValuesModelLayoutQuery,
} from "@/__generated__/RelativeValuesModelLayoutQuery.graphql";

export default async function Layout({
  params,
  children,
}: PropsWithChildren<{
  params: { username: string; slug: string; variableName: string };
}>) {
  const query = await loadPageQuery<RelativeValuesModelLayoutQuery>(QueryNode, {
    input: {
      owner: { username: params.username },
      slug: params.slug,
    },
    forRelativeValues: {
      variableName: params.variableName,
    },
  });

  return (
    <RelativeValuesModelLayout query={query} variableName={params.variableName}>
      {children}
    </RelativeValuesModelLayout>
  );
}
