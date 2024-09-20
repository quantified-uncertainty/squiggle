"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { LLMName, MODEL_CONFIGS, SerializedWorkflow } from "@quri/squiggle-ai";
import {
  Button,
  SelectStringFormField,
  StyledTab,
  TextAreaFormField,
} from "@quri/ui";

import { CreateRequestBody } from "./utils";
import { WorkflowSummaryList } from "./WorkflowSummaryList";

type Handle = {
  edit: (code: string) => void;
};

type Props = {
  submitWorkflow: (requestBody: CreateRequestBody) => void;
  selectWorkflow: (id: string) => void;
  selectedWorkflow: SerializedWorkflow | undefined;
  workflows: SerializedWorkflow[];
};

type FormShape = {
  prompt: string;
  squiggleCode: string;
  model: LLMName;
};

export const Sidebar = forwardRef<Handle, Props>(function Sidebar(
  { submitWorkflow, selectWorkflow, selectedWorkflow, workflows },
  ref
) {
  const form = useForm<FormShape>({
    defaultValues: {
      prompt:
        "Make a 1-line model, that is just 1 line in total, no comments, no decorators. Be creative.",
      squiggleCode: "",
      model: "Claude-Sonnet",
    },
  });

  const [mode, setMode] = useState<"create" | "edit">("create");

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
    async ({ prompt, squiggleCode, model }, event) => {
      const requestBody: CreateRequestBody = {
        prompt: mode === "create" ? prompt : undefined,
        squiggleCode: mode === "edit" ? squiggleCode : undefined,
        model,
      };

      submitWorkflow(requestBody);
      form.setValue("prompt", "");
    }
  );

  return (
    <FormProvider {...form}>
      <div className="flex flex-col space-y-4">
        <StyledTab.Group
          selectedIndex={mode === "edit" ? 1 : 0}
          onChange={(index) => setMode(index === 0 ? "create" : "edit")}
        >
          <StyledTab.List stretch theme="primary">
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
        <SelectStringFormField<FormShape, LLMName>
          name="model"
          label="Model"
          size="small"
          options={Object.keys(MODEL_CONFIGS) as LLMName[]}
          required
        />
        <Button theme="primary" wide onClick={handleSubmit}>
          Send
        </Button>
        <div className="flex-grow overflow-y-auto">
          <h2 className="mb-2 text-sm font-bold">Actions</h2>
          <WorkflowSummaryList
            workflows={workflows}
            selectedWorkflow={selectedWorkflow}
            selectWorkflow={selectWorkflow}
          />
        </div>
      </div>
    </FormProvider>
  );
});
