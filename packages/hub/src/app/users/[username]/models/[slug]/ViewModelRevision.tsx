import { FC } from "react";
import ReactMarkdown from "react-markdown";
import { useFragment } from "react-relay";
import remarkBreaks from "remark-breaks";

import { ModelRevision$key } from "@/__generated__/ModelRevision.graphql";
import { ViewSquiggleContent } from "@/components/SquiggleContent/ViewSquiggleContent";
import { VariablesWithDefinitionsList } from "@/components/variablesWithDefinitions/VariablesWithDefinitionsList";
import { ModelRevisionFragment } from "./ModelRevision";

type Props = {
  revisionRef: ModelRevision$key;
};

const Content: FC<Props> = ({ revisionRef }) => {
  const revision = useFragment(ModelRevisionFragment, revisionRef);
  const typename = revision.content.__typename;

  switch (typename) {
    case "SquiggleSnippet":
      return (
        <ViewSquiggleContent
          contentRef={revision.content}
          definitionRef={revision.forDefinition}
        />
      );
    default:
      return <div>Unknown model type {typename}</div>;
  }
};

export const ViewModelRevision: FC<Props> = ({ revisionRef }) => {
  const revision = useFragment(ModelRevisionFragment, revisionRef);

  return (
    <div>
      {revision.description === "" ? null : (
        <div className="mb-4">
          <ReactMarkdown
            remarkPlugins={[remarkBreaks]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-2xl font-medium" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-xl font-bold" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="font-bold" {...props} />
              ),
            }}
          >
            {revision.description}
          </ReactMarkdown>
        </div>
      )}
      {revision.variablesWithDefinitions.length ? (
        <div className="mb-4">
          <VariablesWithDefinitionsList dataRef={revision} />
        </div>
      ) : null}
      <Content revisionRef={revisionRef} />
    </div>
  );
};
