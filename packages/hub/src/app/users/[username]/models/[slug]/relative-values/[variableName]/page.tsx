"use client";

import { useFragment, useLazyLoadQuery } from "react-relay";

import { ModelPageQuery as ModelPageQueryType } from "@gen/ModelPageQuery.graphql";
import { ModelPageFragment, ModelPageQuery } from "../../ModelPage";
import { ViewModelRevision } from "../../ViewModelRevision";
import { ModelPage$key } from "@/__generated__/ModelPage.graphql";
import { ViewModelRevisionContentForRelativeValues } from "./ViewModelRevisionContentForRelativeValues";

export default function ModelRelativeValuesPage({
  params,
}: {
  params: {
    username: string;
    slug: string;
    variableName: string;
  };
}) {
  // TODO: this might error if variableName is ambiguous; we should render all matching definitions in that case.
  const { model: modelRef } = useLazyLoadQuery<ModelPageQueryType>(
    ModelPageQuery,
    {
      input: {
        ownerUsername: params.username,
        slug: params.slug,
      },
      forRelativeValues: {
        variableName: params.variableName,
      },
    }
  );

  const model = useFragment<ModelPage$key>(ModelPageFragment, modelRef);

  return (
    <ViewModelRevision
      revisionRef={model.currentRevision}
      modelUsername={params.username}
      modelSlug={params.slug}
    >
      <ViewModelRevisionContentForRelativeValues
        revisionRef={model.currentRevision}
      />
    </ViewModelRevision>
  );
}
