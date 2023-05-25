"use client";

import { useLazyLoadQuery } from "react-relay";

import { DefinitionPageQuery as DefinitionPageQueryType } from "@gen/DefinitionPageQuery.graphql";
import { DefinitionPageQuery } from "../DefinitionPage";
import { EditDefinitionPageBody } from "./EditDefinitionPageBody";

export default function Page({
  params,
}: {
  params: { username: string; slug: string };
}) {
  const data = useLazyLoadQuery<DefinitionPageQueryType>(DefinitionPageQuery, {
    input: { ownerUsername: params.username, slug: params.slug },
  });

  return <EditDefinitionPageBody definitionRef={data.definition} />;
}
