"use client";
import { FC, use } from "react";

import { QuestionFragment } from "../../web/fragments.generated";
import { QuestionCard } from "../../web/questions/components/QuestionCard";
import { SearchUIContext } from "./SearchUIProvider";

type Props = {
  results: QuestionFragment[];
};

export const QuestionCardsList: FC<Props> = ({ results }) => {
  const { showId } = use(SearchUIContext);

  if (!results) {
    return null;
  }

  return (
    <>
      {results.map((result) => (
        <QuestionCard
          key={result.id}
          question={result}
          showTimeStamp={false}
          expandFooterToFullWidth={false}
          showIdToggle={showId}
        />
      ))}
    </>
  );
};
