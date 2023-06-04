import { SquiggleContent$key } from "@/__generated__/SquiggleContent.graphql";
import { SquiggleChart } from "@quri/squiggle-components";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

// common for edit and view tabs
export const SquiggleContentFragment = graphql`
  fragment SquiggleContent on SquiggleSnippet {
    id
    code
  }
`;

type Props = {
  dataRef: SquiggleContent$key;
};

export const SquiggleContent: FC<Props> = ({ dataRef }) => {
  const content = useFragment(SquiggleContentFragment, dataRef);

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
