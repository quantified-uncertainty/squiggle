import { FC, PropsWithChildren } from "react";
import { useFragment } from "react-relay";

import { ModelRevision$key } from "@/__generated__/ModelRevision.graphql";

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
  return <div className="py-4 px-8">{children}</div>;
};
