"use client";

import { FC } from "react";
import { useFragment } from "react-relay";

import { ModelRevision$key } from "@/__generated__/ModelRevision.graphql";
import { SquiggleContent } from "@/squiggle/components/SquiggleContent";
import { ModelRevisionFragment } from "./ModelRevision";
import {
  ModelPageFragment,
  PreloadedModelPageQuery,
  useModelPageQuery,
} from "./ModelPage";
import { ModelPage$key } from "@/__generated__/ModelPage.graphql";

export const ViewModelRevision: FC<{
  query: PreloadedModelPageQuery;
}> = ({ query }) => {
  const modelRef = useModelPageQuery(query);
  const model = useFragment<ModelPage$key>(ModelPageFragment, modelRef);

  const revision = useFragment<ModelRevision$key>(
    ModelRevisionFragment,
    model.currentRevision
  );
  const typename = revision.content.__typename;

  switch (typename) {
    case "SquiggleSnippet":
      return <SquiggleContent dataRef={revision.content} />;
    default:
      return <div>Unknown model type {typename}</div>;
  }
};
