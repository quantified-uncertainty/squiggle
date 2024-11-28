"use client";
import { FC, use, useMemo } from "react";

import {
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

import { ModelCardDTO } from "@/server/models/data/card";
import { sqProjectWithHubLinker } from "@/squiggle/components/linker";

type Props = {
  data: NonNullable<ModelCardDTO["currentRevision"]["squiggleSnippet"]>;
};

export const ViewSquiggleSnippet: FC<Props> = ({ data }) => {
  const { version, code } = data;

  const checkedVersion = useAdjustSquiggleVersion(version);

  const squiggle = use(versionedSquigglePackages(checkedVersion));

  const project = useMemo(() => sqProjectWithHubLinker(squiggle), [squiggle]);

  return <squiggle.components.SquiggleChart code={code} project={project} />;
};
