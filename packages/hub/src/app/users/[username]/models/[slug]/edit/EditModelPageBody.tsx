import { FC } from "react";
import { useFragment } from "react-relay";

import { ModelPage$key } from "@/__generated__/ModelPage.graphql";
import { EditSquiggleSnippetModel } from "@/squiggle/components/EditSquiggleSnippetModel";
import { ModelPageFragment } from "../ModelPage";

type Props = {
  modelRef: ModelPage$key;
};

export const EditModelPageBody: FC<Props> = ({ modelRef }) => {
  const model = useFragment(ModelPageFragment, modelRef);
  const typename = model.currentRevision.content.__typename;

  switch (typename) {
    case "SquiggleSnippet":
      return <EditSquiggleSnippetModel modelRef={modelRef} />;
    default:
      return <div>Unknown model type {typename}</div>;
  }
};
