import "server-only";

import * as Prisma from "@prisma/client";

import { CodeArtifact, Workflow } from "@quri/squiggle-ai/server";

import { prisma } from "@/prisma";
import { getAiCodec } from "@/server/ai/utils";
import { v2WorkflowDataSchema } from "@/server/ai/v2_0";
import { checkRootUser } from "@/server/users/auth";

async function loadWorkflows() {
  await checkRootUser();
  return prisma.aiWorkflow.findMany({
    orderBy: { createdAt: "desc" },
  });
}

type LLMStepInstance = ReturnType<Workflow["getSteps"]>[number];

function extractSteps(workflow: Workflow, name: string) {
  const steps: LLMStepInstance[] = [];
  for (const step of workflow.getSteps()) {
    if (step.template.name === name) {
      steps.push(step);
    }
  }
  return steps;
}

function* getModernWorkflows(
  rows: Prisma.AiWorkflow[]
): Generator<Workflow, void> {
  for (const row of rows) {
    if (row.format !== "V2_0") {
      continue;
    }

    const { bundle, entrypoint } = v2WorkflowDataSchema.parse(row.workflow);
    const codec = getAiCodec();
    const deserializer = codec.makeDeserializer(bundle);
    const workflow = deserializer.deserialize(entrypoint);
    yield workflow;
  }
}

export async function getTypeStats() {
  const rows = await loadWorkflows();

  const workflows = [...getModernWorkflows(rows)];

  const typeStats: Record<string, Record<string, number>> = {};

  const stepNames = [
    "GenerateCode",
    "AdjustToFeedback",
    "FixCodeUntilItRuns",
    "MatchStyleGuide",
  ];

  for (const stepName of stepNames) {
    typeStats[stepName] = {};
    for (const workflow of workflows) {
      for (const step of extractSteps(workflow, stepName)) {
        const state = step.getState();
        if (state.kind === "FAILED") {
          typeStats[stepName]["FAILED"] =
            (typeStats[stepName]["FAILED"] ?? 0) + 1;
          continue;
        }
        if (state.kind !== "DONE") {
          continue;
        }
        const code = state.outputs["code"];
        if (code && code instanceof CodeArtifact) {
          typeStats[stepName][code.value.type] =
            (typeStats[stepName][code.value.type] ?? 0) + 1;
        }
      }
    }
  }

  return typeStats;
}

export type StepError = {
  error: string;
  date: Date;
  stepName: string;
};

export async function getCodeErrors() {
  const rows = await loadWorkflows();

  const errors: StepError[] = [];
  for (const workflow of getModernWorkflows(rows)) {
    for (const step of workflow.getSteps()) {
      const state = step.getState();
      if (state.kind !== "DONE") {
        continue;
      }
      const code = state.outputs["code"];
      if (
        code &&
        code instanceof CodeArtifact &&
        code.value.type === "runFailed"
      ) {
        errors.push({
          error: code.value.error,
          // step.startTime is private
          date: new Date(step.toParams().startTime),
          stepName: step.template.name,
        });
      }
    }
  }

  return errors;
}

export async function getStepErrors() {
  const rows = await loadWorkflows();

  const errors: StepError[] = [];
  for (const workflow of getModernWorkflows(rows)) {
    for (const step of workflow.getSteps()) {
      const state = step.getState();
      if (state.kind === "FAILED") {
        errors.push({
          error: state.message,
          date: new Date(step.toParams().startTime),
          stepName: step.template.name,
        });
      }
    }
  }

  return errors;
}
