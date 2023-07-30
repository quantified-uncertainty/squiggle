"use client";

import { FC } from "react";
import { useFragment } from "react-relay";

import { ModelPage$key } from "@/__generated__/ModelPage.graphql";
import { EditSquiggleSnippetModel } from "@/squiggle/components/EditSquiggleSnippetModel";
import {
  ModelPageFragment,
  PreloadedModelPageQuery,
  useModelPageQuery,
} from "./ModelPage";

export const EditModelPageBody: FC<{
  query: PreloadedModelPageQuery;
}> = ({ query }) => {
  const modelRef = useModelPageQuery(query);
  const model = useFragment<ModelPage$key>(ModelPageFragment, modelRef);
  const typename = model.currentRevision.content.__typename;

  switch (typename) {
    case "SquiggleSnippet":
      return <EditSquiggleSnippetModel modelRef={modelRef} />;
    default:
      return <div>Unknown model type {typename}</div>;
  }
};
