"use client";

import { useFragment } from "react-relay";

import { ModelPage$key } from "@/__generated__/ModelPage.graphql";
import { ModelPageFragment, useModelPageQuery } from "../ModelPage";
import { ViewModelRevision } from "../ViewModelRevision";

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
    <div className="py-4 px-8">
      <ViewModelRevision revisionRef={model.currentRevision} />
    </div>
  );
}
