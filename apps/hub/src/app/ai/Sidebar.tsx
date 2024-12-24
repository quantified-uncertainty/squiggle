"use client";

import _ from "lodash";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";

import { LlmId, MODEL_CONFIGS } from "@quri/squiggle-ai";
import {
  Button,
  NumberFormField,
  SelectStringFormField,
  StyledTab,
  TextAreaFormField,
  TextFormField,
} from "@quri/ui";

import { AiWorkflow } from "@/ai/data/loadWorkflows";

import { AiRequestBody } from "./utils";
import { WorkflowSummaryList } from "./WorkflowSummaryList";

type Handle = {
  edit: (code: string) => void;
};

type Props = {
  submitWorkflow: (requestBody: AiRequestBody) => void;
  selectWorkflow: (id: string) => void;
  selectedWorkflow: AiWorkflow | undefined;
  workflows: AiWorkflow[];
  loadNext?: (count: number) => void;
};

type FormShape = {
  prompt: string;
  squiggleCode: string;
  model: LlmId;
  numericSteps: number;
  styleGuideSteps: number;
  anthropicApiKey: string;
};

export const Sidebar = forwardRef<Handle, Props>(function Sidebar(
  { submitWorkflow, selectWorkflow, selectedWorkflow, workflows, loadNext },
  ref
) {
  const form = useForm<FormShape>({
    defaultValues: {
      prompt: `Create a cost-benefit analysis for a new bubble tea store in Berkeley. Model over 5 years. 

Include:
- Setup and monthly operating costs
- Revenue streams
- Market factors and risks (including failure probability)

Outputs:
- Key costs and benefits table
- Cumulative failure probability
- Charts: monthly costs, benefits, net value over time`,
      squiggleCode: "",
      model: "Claude-Sonnet",
      numericSteps: 1,
      styleGuideSteps: 1,
      anthropicApiKey: "",
    },
  });

  const [mode, setMode] = useState<"create" | "edit">("create");
  const prevWorkflowsLengthRef = useRef(workflows.length);

  useEffect(() => {
    if (workflows.length > prevWorkflowsLengthRef.current) {
      selectWorkflow(workflows[0].workflow.id);
      prevWorkflowsLengthRef.current = workflows.length;
    }
  }, [workflows, selectWorkflow]);

  useImperativeHandle(ref, () => ({
    edit: (code: string) => {
      setMode("edit");
      form.setValue("squiggleCode", code);
      setTimeout(() => {
        form.setFocus("squiggleCode");
      }, 0);
    },
  }));

  const handleSubmit = form.handleSubmit(
    async ({
      prompt,
      squiggleCode,
      model,
      numericSteps,
      styleGuideSteps,
      anthropicApiKey,
    }) => {
      const commonRequestFields: Pick<
        AiRequestBody,
        "model" | "numericSteps" | "styleGuideSteps" | "anthropicApiKey"
      > = {
        model: model as LlmId,
        numericSteps,
        styleGuideSteps,
        anthropicApiKey,
      };

      const requestBody: AiRequestBody =
        mode === "create"
          ? {
              kind: "create",
              prompt,
              ...commonRequestFields,
            }
          : {
              kind: "edit",
              squiggleCode,
              ...commonRequestFields,
            };

      submitWorkflow(requestBody);
    }
  );

  const [prompt, squiggleCode] = form.watch(["prompt", "squiggleCode"]);

  const isSubmitDisabled =
    mode === "create" ? !prompt?.trim() : !squiggleCode?.trim();

  return (
    <FormProvider {...form}>
      <div className="flex flex-col space-y-4">
        <StyledTab.Group
          selectedIndex={mode === "edit" ? 1 : 0}
          onChange={(index) => {
            const newMode = index === 0 ? "create" : "edit";
            setMode(newMode);
          }}
        >
          <StyledTab.List stretch>
            <StyledTab name="Create" />
            <StyledTab name="Improve" />
          </StyledTab.List>
          <div className="mt-2">
            <StyledTab.Panels>
              <StyledTab.Panel>
                <div className="mb-3 mt-2 text-xs italic text-slate-500">
                  Create a Squiggle model for a given prompt. Improves this
                  model with steps to improve its numeric reasoning and
                  documentation, if requested.
                </div>
                <TextAreaFormField<FormShape>
                  name="prompt"
                  label="Prompt"
                  placeholder="Enter your prompt here"
                  rows={10}
                  minRows={10}
                />
              </StyledTab.Panel>
              <StyledTab.Panel>
                <div className="mb-3 mt-2 text-xs italic text-slate-500">
                  Improve Squiggle code. First attempts to fix any errors, then
                  does the requested number of steps to improve the numeric
                  calculations and documentation.
                </div>
                <TextAreaFormField<FormShape>
                  name="squiggleCode"
                  label="Squiggle Code"
                  placeholder="Enter your Squiggle code here"
                  rows={8}
                  minRows={6}
                  maxRows={20}
                />
              </StyledTab.Panel>
            </StyledTab.Panels>
          </div>
        </StyledTab.Group>
        <div className="flex flex-col gap-2">
          <NumberFormField<FormShape>
            name="numericSteps"
            label="Numeric Steps"
            tooltip="Enhance the model's numerical calculations and reasoning."
            inputWidth="w-16"
            size="small"
            layout="row"
            rules={{ min: 0, required: true }}
          />
          <NumberFormField<FormShape>
            name="styleGuideSteps"
            label="Documentation Steps"
            tooltip="Improve the model's documentation and formatting."
            inputWidth="w-16"
            size="small"
            layout="row"
            rules={{ min: 0, required: true }}
          />
          <TextFormField<FormShape>
            name="anthropicApiKey"
            label="Anthropic API Key"
            tooltip="Anthropic API key for using Claude."
            placeholder="Optional"
            size="small"
            layout="row"
          />
        </div>
        <SelectStringFormField<FormShape, LlmId>
          label="Model"
          tooltip="Choose the LLM to use. Sonnet is much better than Haiku, but is around 3x more expensive. We use the latest versions of Sonnet 3.5 and Haiku 3.5."
          layout="row"
          name="model"
          size="small"
          options={MODEL_CONFIGS.filter(
            (model) => model.provider === "anthropic"
          ).map((model) => model.id)}
          required
        />
        <Button wide onClick={handleSubmit} disabled={isSubmitDisabled}>
          Start Workflow
        </Button>
        <WorkflowSummaryList
          workflows={workflows}
          loadNext={loadNext}
          selectedWorkflow={selectedWorkflow}
          selectWorkflow={selectWorkflow}
        />
      </div>
    </FormProvider>
  );
});
