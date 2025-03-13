"use client";

import { FC, use } from "react";

import { getHubLinker } from "@quri/hub-linker";
import {
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

import { ModelRevisionFullDTO } from "@/models/data/fullRevision";

export const ModelRevisionView: FC<{
  revision: ModelRevisionFullDTO;
}> = ({ revision }) => {
  const checkedVersion = useAdjustSquiggleVersion(
    revision.squiggleSnippet.version
  );

  const squiggle = use(versionedSquigglePackages(checkedVersion));

  return (
    <squiggle.components.SquigglePlayground
      defaultCode={revision.squiggleSnippet.code}
      linker={getHubLinker(squiggle)}
    />
  );
};
