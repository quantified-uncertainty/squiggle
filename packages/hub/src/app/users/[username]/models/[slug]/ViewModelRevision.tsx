import { FC } from "react";
import ReactMarkdown from "react-markdown";
import { useFragment } from "react-relay";
import remarkBreaks from "remark-breaks";

import { ModelRevision$key } from "@/__generated__/ModelRevision.graphql";
import { SquiggleContent } from "@/squiggle/components/SquiggleContent";
import { VariablesWithDefinitionsList } from "@/components/variablesWithDefinitions/VariablesWithDefinitionsList";
import { ViewSquiggleContentForRelativeValuesDefinition } from "@/relative-values/components/ViewSquiggleContentForRelativeValuesDefinition";
import { ModelRevisionFragment } from "./ModelRevision";

type Props = {
  modelUsername: string;
  modelSlug: string;
  revisionRef: ModelRevision$key;
};

const Content: FC<{ revisionRef: ModelRevision$key }> = ({ revisionRef }) => {
  const revision = useFragment(ModelRevisionFragment, revisionRef);
  const typename = revision.content.__typename;

  switch (typename) {
    case "SquiggleSnippet": {
      const definitionRef =
        revision.forRelativeValues?.definition.currentRevision;
      if (definitionRef) {
        return (
          <ViewSquiggleContentForRelativeValuesDefinition
            contentRef={revision.content}
            definitionRef={definitionRef}
          />
        );
      }

      return <SquiggleContent dataRef={revision.content} />;
    }
    default:
      return <div>Unknown model type {typename}</div>;
  }
};

export const ViewModelRevision: FC<Props> = ({
  revisionRef,
  modelUsername,
  modelSlug,
}) => {
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
              a: ({ node, href, children }) => (
                // TODO - nofollow?
                // TODO - StyledLink for internal URLs
                <a href={href} className="text-blue-500 hover:underline">
                  {children}
                </a>
              ),
            }}
          >
            {revision.description}
          </ReactMarkdown>
        </div>
      )}
      {revision.relativeValuesExports.length ? (
        <div className="pb-4 mb-4 border-b border-slate-200">
          <VariablesWithDefinitionsList
            dataRef={revision}
            modelUsername={modelUsername}
            modelSlug={modelSlug}
          />
        </div>
      ) : null}
      <Content revisionRef={revisionRef} />
    </div>
  );
};
