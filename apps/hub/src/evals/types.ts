import { Value } from "@quri/hub-db";

import { QuestionDTO } from "./data/questions";

type EvalRunnerResult = Pick<Value, "questionId" | "code" | "workflowId">;

// Eval runners are pluggable.
// The main one is Squiggle AI eval runner, but we can add more.
export type EvalRunner = (question: QuestionDTO) => Promise<EvalRunnerResult>;
