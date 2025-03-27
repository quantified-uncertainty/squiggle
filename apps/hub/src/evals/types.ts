import { Question, Value } from "@quri/hub-db";

type EvalRunnerResult = Pick<Value, "questionId" | "code" | "workflowId">;

// Eval runners are pluggable.
// The main one is Squiggle AI eval runner, but we can add more (e.g. prompting a human to evaluate, or loading resolved results from Metaforecast database).
export type EvalRunner = (question: Question) => Promise<EvalRunnerResult>;
