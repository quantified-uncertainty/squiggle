import { FC, PropsWithChildren } from "react";
import ReactMarkdown from "react-markdown";
import { useFragment } from "react-relay";
import remarkBreaks from "remark-breaks";

import { ModelRevision$key } from "@/__generated__/ModelRevision.graphql";
import { ModelExportsPicker } from "@/components/exports/ModelExportsPicker";
import { ModelRevisionFragment } from "./ModelRevision";

// this is layout-like pattern, but we already use layout in this route for other purposes
type Props = PropsWithChildren<{
  modelUsername: string;
  modelSlug: string;
  revisionRef: ModelRevision$key;
}>;

export const ViewModelRevision: FC<Props> = ({
  revisionRef,
  modelUsername,
  modelSlug,
  children,
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
          <div className="flex items-center gap-2 font-medium text-sm">
            <header>View export:</header>
            <ModelExportsPicker
              dataRef={revision}
              modelUsername={modelUsername}
              modelSlug={modelSlug}
              selected={revision.forRelativeValues ?? undefined}
            />
          </div>
        </div>
      ) : null}
      <div>{children}</div>
    </div>
  );
};
