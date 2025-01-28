import { QuestionFragment } from "../../fragments.generated";
import { getBasePath } from "../../utils";

type Props = {
  question: QuestionFragment;
  linkToMetaforecast?: boolean;
};

export const QuestionTitle: React.FC<Props> = ({
  question,
  linkToMetaforecast,
}) => (
  <h1 className="sm:text-3xl text-lg">
    <a
      className="text-black no-underline hover:text-gray-700"
      href={
        linkToMetaforecast
          ? getBasePath() + `/questions/${question.id}`
          : question.url
      }
      target="_blank"
    >
      {question.title}
    </a>
  </h1>
);
