"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";

import { ClientWorkflow, LlmId, MODEL_CONFIGS } from "@quri/squiggle-ai";
import {
  Button,
  NumberFormField,
  SelectStringFormField,
  StyledTab,
  TextAreaFormField,
  TextTooltip,
} from "@quri/ui";

import { LoadMoreViaSearchParam } from "@/components/LoadMoreViaSearchParam";

import { AiRequestBody } from "./utils";
import { WorkflowSummaryList } from "./WorkflowSummaryList";

type Handle = {
  edit: (code: string) => void;
};

type Props = {
  submitWorkflow: (requestBody: AiRequestBody) => void;
  selectWorkflow: (id: string) => void;
  selectedWorkflow: ClientWorkflow | undefined;
  workflows: ClientWorkflow[];
  hasMoreWorkflows: boolean;
};

type FormShape = {
  prompt: string;
  squiggleCode: string;
  model: LlmId;
  numericSteps: number;
  styleGuideSteps: number;
};

export const Sidebar = forwardRef<Handle, Props>(function Sidebar(
  {
    submitWorkflow,
    selectWorkflow,
    selectedWorkflow,
    workflows,
    hasMoreWorkflows,
  },
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
      numericSteps: 3,
      styleGuideSteps: 2,
    },
  });

  const [mode, setMode] = useState<"create" | "edit">("create");
  const prevWorkflowsLengthRef = useRef(workflows.length);

  useEffect(() => {
    if (workflows.length > prevWorkflowsLengthRef.current) {
      selectWorkflow(workflows[0].id);
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
    async ({ prompt, squiggleCode, model, numericSteps, styleGuideSteps }) => {
      const requestBody: AiRequestBody =
        mode === "create"
          ? {
              kind: "create",
              prompt,
              model: model as LlmId,
              numericSteps,
              styleGuideSteps,
            }
          : {
              kind: "edit",
              squiggleCode,
              model: model as LlmId,
              numericSteps: 0,
              styleGuideSteps: 0,
            };

      submitWorkflow(requestBody);
      form.setValue("prompt", "");
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
            <StyledTab name="Fix" />
          </StyledTab.List>
          <div className="mt-2">
            <StyledTab.Panels>
              <StyledTab.Panel>
                <TextAreaFormField<FormShape>
                  name="prompt"
                  label="Prompt"
                  placeholder="Enter your prompt here"
                  rows={10}
                  minRows={10}
                />
              </StyledTab.Panel>
              <StyledTab.Panel>
                <TextAreaFormField<FormShape>
                  name="squiggleCode"
                  label="Squiggle Code"
                  placeholder="Enter your Squiggle code here"
                  rows={12}
                  minRows={12}
                />
              </StyledTab.Panel>
            </StyledTab.Panels>
          </div>
        </StyledTab.Group>
        {mode === "create" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <TextTooltip
                text="Enhance the model's numerical calculations and reasoning."
                placement="bottom"
              >
                <span className="cursor-help text-sm underline decoration-dotted">
                  Numeric Steps
                </span>
              </TextTooltip>
              <span className="w-16">
                <NumberFormField<FormShape> name="numericSteps" size="small" />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <TextTooltip
                text="Improve the model's documentation and formatting."
                placement="bottom"
              >
                <span className="cursor-help text-sm underline decoration-dotted">
                  Documentation Steps
                </span>
              </TextTooltip>
              <span className="w-16">
                <NumberFormField<FormShape>
                  name="styleGuideSteps"
                  size="small"
                />
              </span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <TextTooltip
            text="Choose the LLM to use. Sonnet is much better than Haiku, but is around 3x more expensive. We use the latest versions of Sonnet 3.5 and Haiku 3.5."
            placement="bottom"
          >
            <span className="cursor-help text-sm underline decoration-dotted">
              Model
            </span>
          </TextTooltip>
          <span className="w-40">
            <SelectStringFormField<FormShape, LlmId>
              name="model"
              size="small"
              options={MODEL_CONFIGS.filter(
                (model) => model.provider === "anthropic"
              ).map((model) => model.id)}
              required
            />
          </span>
        </div>
        <Button wide onClick={handleSubmit} disabled={isSubmitDisabled}>
          Start Workflow
        </Button>
        <div className="flex-grow overflow-y-auto">
          <h2 className="mb-2 text-sm font-bold">Workflows</h2>
          <WorkflowSummaryList
            workflows={workflows}
            selectedWorkflow={selectedWorkflow}
            selectWorkflow={selectWorkflow}
          />
          {hasMoreWorkflows && <LoadMoreViaSearchParam />}
        </div>
      </div>
    </FormProvider>
  );
});
