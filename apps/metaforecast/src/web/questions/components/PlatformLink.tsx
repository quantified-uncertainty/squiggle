import { FC } from "react";

import { BoxedLink } from "../../common/BoxedLink";
import { QuestionFragment } from "../../fragments.generated";

export const PlatformLink: FC<{ question: QuestionFragment }> = ({
  question,
}) => <BoxedLink url={question.url}>{question.platform.label}</BoxedLink>;
