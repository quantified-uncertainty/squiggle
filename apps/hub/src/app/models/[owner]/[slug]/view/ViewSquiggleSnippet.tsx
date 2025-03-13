"use client";
import { FC, use, useMemo } from "react";

import { sqProjectWithHubLinker } from "@quri/hub-linker";
import {
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

import { ModelCardDTO } from "@/models/data/cards";

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
