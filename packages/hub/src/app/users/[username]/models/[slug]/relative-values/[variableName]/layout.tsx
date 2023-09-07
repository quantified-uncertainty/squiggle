import { PropsWithChildren, ReactNode } from "react";

import { RelativeValuesModelLayout } from "./RelativeValuesModelLayout";
import { loadSerializableQuery } from "@/relay/loadSerializableQuery";
import QueryNode, {
  RelativeValuesModelLayoutQuery,
} from "@/__generated__/RelativeValuesModelLayoutQuery.graphql";

export default async function Layout({
  params,
  children,
}: PropsWithChildren<{
  params: { username: string; slug: string; variableName: string };
}>) {
  const query = await loadSerializableQuery<
    typeof QueryNode,
    RelativeValuesModelLayoutQuery
  >(QueryNode.params, {
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
