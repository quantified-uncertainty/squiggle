import { FC } from "react";
import { useFragment } from "react-relay";

import { ModelRevision$key } from "@/__generated__/ModelRevision.graphql";
import { SquiggleContent } from "@/squiggle/components/SquiggleContent";
import { ModelRevisionFragment } from "./ModelRevision";

export const ViewModelRevisionContent: FC<{
  revisionRef: ModelRevision$key;
}> = ({ revisionRef }) => {
  const revision = useFragment(ModelRevisionFragment, revisionRef);
  const typename = revision.content.__typename;

  switch (typename) {
    case "SquiggleSnippet":
      return <SquiggleContent dataRef={revision.content} />;
    default:
      return <div>Unknown model type {typename}</div>;
  }
};
