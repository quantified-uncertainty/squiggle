import { ReactNode } from "react";

import { loadModelPageQuery } from "../../loadModelPageQuery";
import { RelativeValuesModelLayout } from "./RelativeValuesModelLayout";

export default async function Layout({
  params,
  children,
}: {
  params: { username: string; slug: string; variableName: string };
  children: ReactNode;
}) {
  const query = await loadModelPageQuery(
    {
      ownerUsername: params.username,
      slug: params.slug,
    },
    {
      variableName: params.variableName,
    }
  );

  return (
    <RelativeValuesModelLayout query={query} variableName={params.variableName}>
      {children}
    </RelativeValuesModelLayout>
  );
}
