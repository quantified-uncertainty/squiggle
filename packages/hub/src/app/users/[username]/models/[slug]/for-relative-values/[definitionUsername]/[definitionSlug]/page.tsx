"use client";

import { useFragment, useLazyLoadQuery } from "react-relay";

import { ModelPageQuery as ModelPageQueryType } from "@gen/ModelPageQuery.graphql";
import { ModelPageFragment, ModelPageQuery } from "../../../ModelPage";
import { ViewModelRevision } from "../../../ViewModelRevision";
import { ModelPage$key } from "@/__generated__/ModelPage.graphql";

export default function OuterModelPage({
  params,
}: {
  params: {
    username: string;
    slug: string;
    definitionUsername: string;
    definitionSlug: string;
  };
}) {
  const { model: modelRef } = useLazyLoadQuery<ModelPageQueryType>(
    ModelPageQuery,
    {
      input: {
        ownerUsername: params.username,
        slug: params.slug,
      },
      forRelativeValues: {
        username: params.definitionUsername,
        slug: params.definitionSlug,
      },
    }
  );

  const model = useFragment<ModelPage$key>(ModelPageFragment, modelRef);

  return (
    <ViewModelRevision
      revisionRef={model.currentRevision}
      modelUsername={params.username}
      modelSlug={params.slug}
    />
  );
}
