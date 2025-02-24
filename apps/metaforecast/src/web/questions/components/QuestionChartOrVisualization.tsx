import { FC } from "react";

import { QuestionWithHistoryFragment } from "../../fragments.generated";
import { HistoryChart } from "./HistoryChart";

export const QuestionChartOrVisualization: FC<{
  question: QuestionWithHistoryFragment;
}> = ({ question }) => {
  if (question.platform.id === "guesstimate" && question.visualization) {
    return (
      <a className="no-underline" href={question.url} target="_blank">
        <img
          className="rounded-sm"
          src={question.visualization}
          alt="Guesstimate Screenshot"
        />
      </a>
    );
  }

  if (question.options.length > 0) {
    return <HistoryChart question={question} />;
  }

  return null; /* Don't display chart if there are no options, for now. */
};
