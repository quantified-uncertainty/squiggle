import { FC, use, useMemo } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import {
  useAdjustSquiggleVersion,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

import { squiggleHubLinker } from "./linker";

import { ViewSquiggleSnippet$key } from "@/__generated__/ViewSquiggleSnippet.graphql";

type Props = {
  dataRef: ViewSquiggleSnippet$key;
};

export const ViewSquiggleSnippet: FC<Props> = ({ dataRef }) => {
  const { version, code } = useFragment(
    graphql`
      fragment ViewSquiggleSnippet on SquiggleSnippet {
        id
        code
        version
      }
    `,
    dataRef
  );

  const checkedVersion = useAdjustSquiggleVersion(version);

  const squiggle = use(versionedSquigglePackages(checkedVersion));

  const project = useMemo(() => {
    return new squiggle.lang.SqProject({
      linker: squiggleHubLinker,
    });
  }, [squiggle.lang]);

  return <squiggle.components.SquiggleChart code={code} project={project} />;
};
