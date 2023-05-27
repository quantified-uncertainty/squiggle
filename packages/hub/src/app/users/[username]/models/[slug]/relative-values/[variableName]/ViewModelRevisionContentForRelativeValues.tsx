import { FC } from "react";
import { useFragment } from "react-relay";

import { ModelRevision$key } from "@/__generated__/ModelRevision.graphql";
import { ViewSquiggleContentForRelativeValuesDefinition } from "@/relative-values/components/ViewSquiggleContentForRelativeValuesDefinition";
import { ModelRevisionFragment } from "../../ModelRevision";

export const ViewModelRevisionContentForRelativeValues: FC<{
  revisionRef: ModelRevision$key;
}> = ({ revisionRef }) => {
  const revision = useFragment(ModelRevisionFragment, revisionRef);
  const typename = revision.content.__typename;

  switch (typename) {
    case "SquiggleSnippet": {
      const definitionRef =
        revision.forRelativeValues?.definition.currentRevision;

      if (!definitionRef) {
        throw new Error("Not found");
      }
      return (
        <ViewSquiggleContentForRelativeValuesDefinition
          contentRef={revision.content}
          definitionRef={definitionRef}
        />
      );
    }
    default:
      return <div>Unknown model type {typename}</div>;
  }
};
