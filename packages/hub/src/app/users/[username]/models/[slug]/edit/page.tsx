"use client";

import { useLazyLoadQuery } from "react-relay";

import { ModelPageQuery as ModelPageQueryType } from "@gen/ModelPageQuery.graphql";
import { ModelPageQuery } from "../ModelPage";
import { EditModelPageBody } from "./EditModelPageBody";

export default function Page({
  params,
}: {
  params: { username: string; slug: string };
}) {
  // should be de-duped by Next.js caches, so it's not a problem that we do this query twice
  const data = useLazyLoadQuery<ModelPageQueryType>(ModelPageQuery, {
    input: { ownerUsername: params.username, slug: params.slug },
  });

  return <EditModelPageBody modelRef={data.model} />;
}
