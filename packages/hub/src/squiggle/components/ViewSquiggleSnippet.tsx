import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { SquiggleChart } from "@quri/squiggle-components";
import { ViewSquiggleSnippet$key } from "@/__generated__/ViewSquiggleSnippet.graphql";

type Props = {
  dataRef: ViewSquiggleSnippet$key;
};

export const ViewSquiggleSnippet: FC<Props> = ({ dataRef }) => {
  const content = useFragment(
    graphql`
      fragment ViewSquiggleSnippet on SquiggleSnippet {
        id
        code
      }
    `,
    dataRef
  );

  return (
    <SquiggleChart
      code={content.code}
      environment={{
        sampleCount: 1000,
        xyPointLength: 1000,
      }}
    />
  );
};
