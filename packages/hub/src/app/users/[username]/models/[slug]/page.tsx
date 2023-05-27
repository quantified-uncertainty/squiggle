"use client";

import { useFragment, useLazyLoadQuery } from "react-relay";

import { ModelPageQuery as ModelPageQueryType } from "@gen/ModelPageQuery.graphql";
import { ModelPageFragment, ModelPageQuery } from "./ModelPage";
import { ViewModelRevision } from "./ViewModelRevision";
import { ModelPage$key } from "@/__generated__/ModelPage.graphql";
import { ViewModelRevisionContent } from "./ViewModelRevisionContent";

export default function OuterModelPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  // should be de-duped by Next.js caches, so it's not a problem that we do this query twice
  const { model: modelRef } = useLazyLoadQuery<ModelPageQueryType>(
    ModelPageQuery,
    {
      input: { ownerUsername: params.username, slug: params.slug },
    }
  );

  const model = useFragment<ModelPage$key>(ModelPageFragment, modelRef);

  return (
    <ViewModelRevision
      revisionRef={model.currentRevision}
      modelUsername={params.username}
      modelSlug={params.slug}
    >
      <ViewModelRevisionContent revisionRef={model.currentRevision} />
    </ViewModelRevision>
  );
}
