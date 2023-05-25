"use client";
import { useFragment, useLazyLoadQuery } from "react-relay";

import { DefinitionPageQuery as DefinitionPageQueryType } from "@gen/DefinitionPageQuery.graphql";
import { DefinitionPageFragment, DefinitionPageQuery } from "./DefinitionPage";
import { DefinitionPage$key } from "@/__generated__/DefinitionPage.graphql";
import { DefinitionRevision } from "./DefinitionRevision";

export default function OuterDefinitionPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  // should be de-duped by Next.js caches, so it's not a problem that we do this query twice
  const data = useLazyLoadQuery<DefinitionPageQueryType>(
    DefinitionPageQuery,
    {
      input: { ownerUsername: params.username, slug: params.slug },
    },
    { fetchPolicy: "store-and-network" }
  );

  const definition = useFragment<DefinitionPage$key>(
    DefinitionPageFragment,
    data.definition
  );

  return <DefinitionRevision dataRef={definition.currentRevision} />;
}
