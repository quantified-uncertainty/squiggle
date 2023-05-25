import { FC } from "react";
import { useFragment } from "react-relay";

import { DefinitionPage$key } from "@/__generated__/DefinitionPage.graphql";
import { EditSquiggleSnippetModel } from "@/components/SquiggleContent/EditSquiggleSnippetModel";
import { DefinitionPageFragment } from "../DefinitionPage";
import { EditRelativeValuesDefinition } from "./EditRelativeValuesDefinition";

type Props = {
  definitionRef: DefinitionPage$key;
};

export const EditDefinitionPageBody: FC<Props> = ({ definitionRef }) => {
  const definition = useFragment(DefinitionPageFragment, definitionRef);
  const typename = definition.currentRevision.content.__typename;

  switch (typename) {
    case "RelativeValuesDefinition":
      return <EditRelativeValuesDefinition definitionRef={definitionRef} />;
    default:
      return <div>Unknown definition type {typename}</div>;
  }
};
