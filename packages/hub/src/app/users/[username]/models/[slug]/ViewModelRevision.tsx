import { FC, PropsWithChildren } from "react";
import { useFragment } from "react-relay";

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
    <div className="py-4 px-8">
      {revision.relativeValuesExports.length ? (
        <div className="pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 font-medium text-sm">
            <ModelExportsPicker
              dataRef={revision}
              modelUsername={modelUsername}
              modelSlug={modelSlug}
              selected={revision.forRelativeValues ?? undefined}
            />
          </div>
        </div>
      ) : null}

      {children}
    </div>
  );
};
