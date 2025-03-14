import { EvalResult, Spec } from "@quri/hub-db";

type EvaluatorResult = Pick<EvalResult, "specId" | "code" | "workflowId">;

// Evaluators are pluggable.
// The main one is Squiggle AI evaluator, but we can add more (e.g. prompting a human to evaluate, or loading resolved results from Metaforecast database).
export type Evaluator = (spec: Spec) => Promise<EvaluatorResult>;
