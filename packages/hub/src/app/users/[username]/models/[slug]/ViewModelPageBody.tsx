import { FC } from "react";
import ReactMarkdown from "react-markdown";
import { useFragment } from "react-relay";
import remarkBreaks from "remark-breaks";

import { ModelPageBody$key } from "@/__generated__/ModelPageBody.graphql";
import { ViewSquiggleSnippetContent } from "@/components/SquiggleSnippetContent/ViewSquiggleSnippetContent";
import { VariablesWithDefinitionsList } from "@/components/variablesWithDefinitions/VariablesWithDefinitionsList";
import { ModelPageBodyFragment } from "./ModelPageBody";

type Props = {
  modelRef: ModelPageBody$key;
};

const Content: FC<Props> = ({ modelRef: model }) => {
  const data = useFragment(ModelPageBodyFragment, model);
  const typename = data.currentRevision.content.__typename;

  switch (typename) {
    case "SquiggleSnippet":
      return (
        <ViewSquiggleSnippetContent contentRef={data.currentRevision.content} />
      );
    default:
      return <div>Unknown model type {typename}</div>;
  }
};

export const ViewModelPageBody: FC<Props> = ({ modelRef }) => {
  const model = useFragment(ModelPageBodyFragment, modelRef);
  const typename = model.currentRevision.content.__typename;

  return (
    <div>
      {model.currentRevision.description === "" ? null : (
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
            {model.currentRevision.description}
          </ReactMarkdown>
        </div>
      )}
      {model.currentRevision.variablesWithDefinitions.length ? (
        <div className="mb-4">
          <VariablesWithDefinitionsList dataRef={model.currentRevision} />
        </div>
      ) : null}
      <Content modelRef={modelRef} />
    </div>
  );
};
