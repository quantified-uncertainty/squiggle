import { FC } from "react";
import { useFragment } from "react-relay";

import { EditSquiggleSnippetModel } from "@/components/SquiggleSnippetContent/EditSquiggleSnippetModel";
import { ModelPageBodyFragment } from "../ModelPageBody";
import { ModelPageBody$key } from "@/__generated__/ModelPageBody.graphql";

type Props = {
  modelRef: ModelPageBody$key;
};

export const EditModelPageBody: FC<Props> = ({ modelRef }) => {
  const model = useFragment(ModelPageBodyFragment, modelRef);
  const typename = model.currentRevision.content.__typename;

  switch (typename) {
    case "SquiggleSnippet":
      return <EditSquiggleSnippetModel modelRef={modelRef} />;
    default:
      return <div>Unknown model type {typename}</div>;
  }
};
