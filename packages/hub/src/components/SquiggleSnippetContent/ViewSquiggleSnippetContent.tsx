import { FC } from "react";
import ReactMarkdown from "react-markdown";
import { useFragment } from "react-relay";
import remarkBreaks from "remark-breaks";

import { SquiggleChart } from "@quri/squiggle-components";

import { SquiggleSnippetContentFragment$key } from "@/__generated__/SquiggleSnippetContentFragment.graphql";
import { Fragment } from "./SquiggleSnippetContent";

export const ViewSquiggleSnippetContent: FC<{
  model: SquiggleSnippetContentFragment$key;
}> = ({ model }) => {
  const data = useFragment(Fragment, model);

  if (data.currentRevision.content.__typename !== "SquiggleSnippet") {
    // shouldn't happen, typename is validated by ModelView
    throw new Error("Internal error");
  }

  return (
    <div>
      {data.currentRevision.description === "" ? null : (
        <div className="mb-4">
          <ReactMarkdown
            remarkPlugins={[remarkBreaks]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-2xl font-medium" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h1 className="text-xl font-bold" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h1 className="font-bold" {...props} />
              ),
            }}
          >
            {data.currentRevision.description}
          </ReactMarkdown>
        </div>
      )}
      <SquiggleChart
        code={data.currentRevision.content.code}
        environment={{
          sampleCount: 1000,
          xyPointLength: 1000,
        }}
      />
    </div>
  );
};
