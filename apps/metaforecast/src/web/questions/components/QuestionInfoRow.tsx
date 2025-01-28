import { QuestionFragment } from "../../fragments.generated";
import { PlatformLink } from "./PlatformLink";
import { QuestionOptions } from "./QuestionOptions";
import { Stars } from "./Stars";

type Props = {
  question: QuestionFragment;
};

export const QuestionInfoRow: React.FC<Props> = ({ question }) => (
  <div className="flex items-center gap-2">
    <PlatformLink question={question} />
    <Stars num={question.qualityIndicators.stars} />
    <QuestionOptions
      question={{ ...question }}
      maxNumOptions={1}
      forcePrimaryMode={true}
    />
  </div>
);
