/**
 * Fermi Model Competition Evaluator based on contest criteria
 */

import { Anthropic } from "@anthropic-ai/sdk";

import { EvaluationResult, Submission, SubmissionEvaluation } from "./types";

// Evaluation criteria and weights
const CRITERIA = {
  SURPRISE: { name: "Surprise", weight: 0.4 },
  RELEVANCE: { name: "Topic Relevance", weight: 0.2 },
  ROBUSTNESS: { name: "Robustness", weight: 0.2 },
  QUALITY: { name: "Model Quality", weight: 0.2 },
};

// Evaluation prompts from the contest description
const PROMPTS = {
  SURPRISE: `You are an expert Fermi model evaluator with extensive experience in constructing and analyzing models.
 
Please provide a numeric score of how surprising the key findings or conclusions of this model are to members of the rationalist and effective altruism communities. In your assessment, consider the following:

- Contradiction of Expectations: Do the results challenge widely held beliefs, intuitive assumptions, or established theories within the communities?
- Counterintuitiveness: Are the findings non-obvious or do they reveal hidden complexities that are not immediately apparent?
- Discovery of Unknowns: Does the model uncover previously unrecognized issues, opportunities, or risks?
- Magnitude of Difference: How significant is the deviation of the model's results from common expectations or prior studies?

Please provide specific details or examples that illustrate the surprising aspects of the findings. Assign a rating from 0 to 10, where:

- 0 indicates 'Not Surprising'
- 10 indicates 'Highly Surprising'

Judge on a curve, where a 5 represents the median expectation.`,

  RELEVANCE: `You are an expert Fermi model evaluator with extensive experience in constructing and analyzing models.

Please provide a numeric score of the importance of the model's subject matter to the rationalist and effective altruism communities. In your evaluation, consider the following:

- Relevance: How directly does the model address issues, challenges, or questions that are central to the interests and goals of these communities?
- Impact Potential: To what extent could the findings influence decision-making, policy, or priority-setting within the communities?

Assign a rating from 0 to 10, where:

- 0 indicates 'Not Important'
- 10 indicates 'Highly Important'

Judge on a curve, where a 5 represents the median expectation.`,

  ROBUSTNESS: `You are an expert Fermi model evaluator with extensive experience in constructing and analyzing models.
 
Please provide a numeric score of the robustness of the model's key findings. In your evaluation, consider the following factors:

- Sensitivity to Assumptions: How dependent are the results on specific assumptions, parameters, or data inputs? Would reasonable changes to these significantly alter the conclusions?
- Evidence Base: How strong and reliable is the data supporting the model? Are the data sources credible and up-to-date?
- Methodological Rigor: Does the model use sound reasoning and appropriate methods? Are potential biases or limitations acknowledged and addressed?
- Consensus of Assumptions: To what extent are the underlying assumptions accepted within the rationalist and effective altruism communities?

Provide a detailed justification, citing specific aspects of the model that contribute to its robustness or lack thereof. Assign a rating from 0 to 10, where:

- 0 indicates 'Not Robust'
- 10 indicates 'Highly Robust'

Judge on a curve, where a 5 represents the median expectation.`,

  QUALITY: `You are an expert Fermi model evaluator with extensive experience in constructing and analyzing models.
 
Please provide a numeric score of the model's quality, focusing on both its construction and presentation. Consider the following elements:

- Comprehensiveness: Does the model account for all key factors and variables relevant to the problem it addresses?
- Data Integration: Are data sources appropriately selected and accurately integrated? Is there evidence of data validation or cross-referencing with established studies?
- Clarity of Assumptions: Are the model's assumptions clearly stated, justified, and reasonable? Does the model distinguish between empirical data and speculative inputs?
- Transparency and Replicability: Is the modeling process transparent enough that others could replicate or audit the results? Are the methodologies and calculations well-documented?
- Logical Consistency: Does the model follow a logical structure, with coherent reasoning leading from premises to conclusions?
- Communication: Are the findings and their significance clearly communicated? Does the model include summaries, visual aids (e.g., charts, graphs), or other tools to enhance understanding?
- Practical Relevance: Does the model provide actionable insights or recommendations? Is it practical for use by stakeholders in the community?

Please provide specific observations and examples to support your evaluation. Assign a rating from 0 to 10, where:

- 0 indicates 'Poor Quality'
- 10 indicates 'Excellent Quality'

Judge on a curve, where a 5 represents the median expectation.`,
};

export type Criterion = keyof typeof CRITERIA;

type EvaluatorConfig = {
  anthropicApiKey: string;
  llmModel: string; // Default model to use
  runsPerSubmission: number; // Number of runs to average (default 3)
};

// Class for evaluating Fermi model submissions
export class FermiContestEvaluator {
  private anthropicClient: Anthropic;

  constructor(private config: EvaluatorConfig) {
    // Initialize Anthropic client
    this.anthropicClient = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
  }

  // Main evaluation function
  public async evaluateSubmissions(
    submissions: Submission[],
    goodhartingPenalties: Record<string, number> = {}
  ): Promise<SubmissionEvaluation[]> {
    const evaluationResults: SubmissionEvaluation[] = [];

    for (const submission of submissions) {
      console.log(
        `\nEvaluating submission: ${submission.id} by ${submission.author}`
      );

      // Combine all submission fields for evaluation
      const fullSubmissionText = submission.text;

      // Evaluate each criterion with multiple runs and average
      const criteriaScores = {} as Record<Criterion, EvaluationResult>; // will be populated below

      // Evaluate each criterion
      for (const [criterionKey, criterion] of Object.entries(CRITERIA)) {
        const prompt = PROMPTS[criterionKey as keyof typeof PROMPTS];
        console.log(`  Evaluating ${criterion.name}...`);

        // Run multiple evaluations and average the scores
        const evaluations = await this.runMultipleEvaluations(
          prompt,
          fullSubmissionText,
          this.config.runsPerSubmission
        );

        // Average the scores
        const averageScore =
          evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) /
          evaluations.length;

        // Combine explanations
        const combinedExplanation = this.combineExplanations(
          evaluations.map((e) => e.explanation)
        );

        criteriaScores[criterionKey as Criterion] = {
          criterionName: criterion.name,
          score: averageScore,
          explanation: combinedExplanation,
        };

        console.log(`    Score: ${averageScore.toFixed(2)}/10`);
      }

      // Calculate total score (weighted average)
      const totalScore = this.calculateTotalScore(criteriaScores);

      // Apply goodharting penalty if any
      const goodhartingPenalty = goodhartingPenalties[submission.id] || 0;
      const finalScore = totalScore * (1 - goodhartingPenalty);

      evaluationResults.push({
        submissionId: submission.id,
        author: submission.author,
        scores: criteriaScores,
        totalScore,
        goodhartingPenalty,
        finalScore,
      });

      console.log(`  Total Score: ${totalScore.toFixed(2)}/10`);
      if (goodhartingPenalty > 0) {
        console.log(
          `  Goodharting Penalty: ${(goodhartingPenalty * 100).toFixed(0)}%`
        );
        console.log(`  Final Score: ${finalScore.toFixed(2)}/10`);
      }
    }

    // Rank submissions by final score
    return this.rankSubmissions(evaluationResults);
  }

  // Run multiple evaluations and return all results
  private async runMultipleEvaluations(
    prompt: string,
    submissionText: string,
    numRuns: number
  ): Promise<Array<{ score: number; explanation: string }>> {
    const results: Array<{ score: number; explanation: string }> = [];

    for (let i = 0; i < numRuns; i++) {
      try {
        const result = await this.evaluateWithLLM(prompt, submissionText);
        results.push(result);
      } catch (error) {
        console.error(`Error in evaluation run ${i + 1}:`, error);
        // If an evaluation fails, we'll use fewer runs rather than failing completely
      }
    }

    return results;
  }

  // Evaluate a submission for a specific criterion using an LLM
  private async evaluateWithLLM(
    prompt: string,
    submissionText: string
  ): Promise<{ score: number; explanation: string }> {
    // Choose the client based on configuration
    return this.evaluateWithAnthropic(prompt, submissionText);
  }

  // Evaluate using Anthropic's Claude
  private async evaluateWithAnthropic(
    prompt: string,
    submissionText: string
  ): Promise<{ score: number; explanation: string }> {
    const modelToUse = this.config.llmModel;

    const response = await this.anthropicClient.messages.create({
      model: modelToUse,
      max_tokens: 1000,
      // system:
      //   "You are an expert evaluator of Fermi estimates for a contest. Extract both a numeric score (0-10) and your reasoning.",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nHere is the Fermi model submission to evaluate:\n\n${submissionText}`,
        },
      ],
    });

    if (response.content[0].type !== "text") {
      throw new Error("Expected a text block");
    }
    const result = response.content[0].text;
    return this.extractScoreAndExplanation(result);
  }

  // Extract numeric score and explanation from LLM response
  private extractScoreAndExplanation(response: string): {
    score: number;
    explanation: string;
  } {
    // Look for a numeric score in the response
    const scoreMatches = response.match(/(\d+(\.\d+)?)\s*\/\s*10/);
    const numericMatches = response.match(/score:?\s*(\d+(\.\d+)?)/i);
    const ratingMatches = response.match(/rating:?\s*(\d+(\.\d+)?)/i);

    // Try to find a score between 0 and 10
    const scorePattern = /\b([0-9]|10)(\.[0-9]+)?\b/;
    const standaloneMatch = response.match(scorePattern);

    let score: number;
    if (scoreMatches) {
      score = parseFloat(scoreMatches[1]);
    } else if (numericMatches) {
      score = parseFloat(numericMatches[1]);
    } else if (ratingMatches) {
      score = parseFloat(ratingMatches[1]);
    } else if (standaloneMatch) {
      score = parseFloat(standaloneMatch[0]);
    } else {
      // If no score is found, default to 5 (middle of the range)
      score = 5;
      console.warn("No score found in response, defaulting to 5/10");
    }

    // Ensure score is within the valid range
    score = Math.max(0, Math.min(10, score));

    return {
      score,
      explanation: response,
    };
  }

  // Combine multiple explanations from different runs
  private combineExplanations(explanations: string[]): string {
    // Store all explanations, separated by run number
    return explanations
      .map((explanation, index) => `##### Run ${index + 1}:\n\n${explanation}`)
      .join("\n\n---\n\n");
  }

  // Calculate total weighted score
  private calculateTotalScore(
    scores: Record<string, EvaluationResult>
  ): number {
    let totalScore = 0;

    for (const [criterionKey, criterion] of Object.entries(CRITERIA)) {
      const result = scores[criterionKey as Criterion];
      totalScore += result.score * criterion.weight;
    }

    return totalScore;
  }

  // Rank submissions by final score
  private rankSubmissions(
    evaluations: SubmissionEvaluation[]
  ): SubmissionEvaluation[] {
    // Sort by final score (descending)
    const ranked = [...evaluations].sort((a, b) => b.finalScore - a.finalScore);

    // Assign ranks
    ranked.forEach((evaluation, index) => {
      evaluation.rank = index + 1;
    });

    return ranked;
  }

  // Generate a formatted report of evaluation results
  public generateReport(evaluations: SubmissionEvaluation[]): string {
    let report = "# Fermi Model Competition Evaluation Results\n\n";

    // Add an overview table
    report += "## Overall Rankings\n\n";
    report +=
      "| Rank | Author | Final Score | Surprise | Topic Relevance | Robustness | Model Quality | Penalty |\n";
    report +=
      "|------|--------|-------------|----------|-----------------|------------|--------------|--------|\n";

    for (const evaluation of evaluations) {
      const surprise = evaluation.scores.SURPRISE.score.toFixed(1);
      const relevance = evaluation.scores.RELEVANCE.score.toFixed(1);
      const robustness = evaluation.scores.ROBUSTNESS.score.toFixed(1);
      const quality = evaluation.scores.QUALITY.score.toFixed(1);
      const penalty =
        evaluation.goodhartingPenalty > 0
          ? `${(evaluation.goodhartingPenalty * 100).toFixed(0)}%`
          : "0%";

      report += `| ${evaluation.rank} | ${evaluation.author} | ${evaluation.finalScore.toFixed(2)} | ${surprise} | ${relevance} | ${robustness} | ${quality} | ${penalty} |\n`;
    }

    // Add detailed results for each submission
    report += "\n## Detailed Evaluation Results\n\n";

    for (const evaluation of evaluations) {
      report += `### ${evaluation.rank}. ${evaluation.author} (${evaluation.submissionId})\n\n`;
      report += `**Final Score**: ${evaluation.finalScore.toFixed(2)}/10`;

      if (evaluation.goodhartingPenalty > 0) {
        report += ` (after ${(evaluation.goodhartingPenalty * 100).toFixed(0)}% penalty)`;
      }

      report += `\n\n`;

      // Add details for each criterion
      for (const [criterionKey, criterion] of Object.entries(CRITERIA)) {
        const result = evaluation.scores[criterionKey as Criterion];
        if (result) {
          report += `#### ${criterion.name} (${(criterion.weight * 100).toFixed(0)}%): ${result.score.toFixed(2)}/10\n\n`;

          // Add a condensed version of the explanation
          const condensedExplanation = this.condenseLLMResponse(
            result.explanation
          );
          report += `${condensedExplanation}\n\n`;
        }
      }

      report += "---\n\n";
    }

    return report;
  }

  // Helper to condense LLM responses to key points
  private condenseLLMResponse(response: string): string {
    // don't condense the response
    return response;
  }
}
