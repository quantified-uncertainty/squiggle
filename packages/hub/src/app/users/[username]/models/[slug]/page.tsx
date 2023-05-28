"use client";

import { useFragment } from "react-relay";

import { ModelPage$key } from "@/__generated__/ModelPage.graphql";
import { ModelPageFragment, useModelPageQuery } from "./ModelPage";
import { ViewModelRevision } from "./ViewModelRevision";
import { ViewModelRevisionContent } from "./ViewModelRevisionContent";

export default function OuterModelPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  const modelRef = useModelPageQuery({
    ownerUsername: params.username,
    slug: params.slug,
  });

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
