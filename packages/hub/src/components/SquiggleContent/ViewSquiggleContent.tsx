import { FC } from "react";
import { useFragment } from "react-relay";

import { SquiggleChart } from "@quri/squiggle-components";

import { SquiggleContent$key } from "@/__generated__/SquiggleContent.graphql";
import { SquiggleContentFragment } from "./SquiggleContent";
import { ViewSquiggleContentForDefinition } from "./ViewSquiggleContentForDefinition";
import { ViewSquiggleContentForDefinition$key } from "@/__generated__/ViewSquiggleContentForDefinition.graphql";

type Props = {
  contentRef: SquiggleContent$key;
  definitionRef: ViewSquiggleContentForDefinition$key | null;
};

export const ViewSquiggleContent: FC<Props> = ({
  contentRef,
  definitionRef,
}) => {
  const content = useFragment(SquiggleContentFragment, contentRef);

  if (definitionRef) {
    return (
      <ViewSquiggleContentForDefinition
        contentRef={contentRef}
        definitionRef={definitionRef}
      />
    );
  }

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
