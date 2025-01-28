import { QuestionFragment } from "../web/fragments.generated";

// this type is good both for backend (e.g. FetchedQuestion["options"]) and for graphql shapes
export type QuestionOption = {
  name?: string;
  probability?: number;
  type: "PROBABILITY";
};

export type FullQuestionOption = Exclude<
  QuestionOption,
  "name" | "probability"
> & {
  name: NonNullable<QuestionOption["name"]>;
  probability: NonNullable<QuestionOption["probability"]>;
};

export function isFullQuestionOption(
  option: QuestionOption | QuestionFragment["options"][0]
): option is FullQuestionOption {
  return option.name != null && option.probability != null;
}
