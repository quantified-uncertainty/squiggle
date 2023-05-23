import { FC } from "react";
import { useFragment } from "react-relay";

import { SquiggleChart } from "@quri/squiggle-components";

import { SquiggleSnippetContent$key } from "@/__generated__/SquiggleSnippetContent.graphql";
import { SquiggleSnippetContentFragment } from "./SquiggleSnippetContent";

export const ViewSquiggleSnippetContent: FC<{
  contentRef: SquiggleSnippetContent$key;
}> = ({ contentRef }) => {
  const content = useFragment(SquiggleSnippetContentFragment, contentRef);

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
