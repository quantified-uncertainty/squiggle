import { Criterion } from "./evaluator";

export type Submission = {
  id: string;
  author: string;
  text: string;
};

export type SubmissionEvaluation = {
  submissionId: string;
  author: string;
  scores: Record<Criterion, EvaluationResult>;
  totalScore: number;
  finalScore: number; // After any goodharting penalties
  goodhartingPenalty: number; // 0 to 1 (percentage)
  rank?: number;
}; // Types for evaluation results

export type EvaluationResult = {
  criterionName: string;
  score: number;
  explanation: string;
};
