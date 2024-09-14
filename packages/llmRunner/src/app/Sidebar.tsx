"use client";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { Button, StyledTab, StyledTextArea } from "@quri/ui";

import { CreateRequestBody, WorkflowDescription } from "./utils/squiggleTypes";
import { WorkflowSummaryItem } from "./WorkflowSummaryItem";

export const Sidebar = forwardRef<
  {
    edit: (code: string) => void;
  },
  {
    submitWorkflow: (requestBody: CreateRequestBody) => void;
    selectWorkflow: (id: string) => void;
    selectedWorkflow: WorkflowDescription | undefined;
    workflows: WorkflowDescription[];
  }
>(function Sidebar(
  { submitWorkflow, selectWorkflow, selectedWorkflow, workflows },
  ref
) {
  const [squiggleCode, setSquiggleCode] = useState("");

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [prompt, setPrompt] = useState(
    "Make a 1-line model, that is just 1 line in total, no comments, no decorators. Be creative."
  );

  useImperativeHandle(ref, () => ({
    edit: (code: string) => {
      setMode("edit");
      setSquiggleCode(code);
      setTimeout(() => {
        editRef.current?.focus();
      }, 0);
    },
  }));

  const handleSubmit = () => {
    const requestBody: CreateRequestBody = {
      prompt: mode === "create" ? prompt : undefined,
      squiggleCode: mode === "edit" ? squiggleCode : undefined,
    };

    submitWorkflow(requestBody);
    setPrompt("");
  };

  const editRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div>
      <StyledTab.Group
        selectedIndex={mode === "edit" ? 1 : 0}
        onChange={(index) => setMode(index === 0 ? "create" : "edit")}
      >
        <StyledTab.List stretch theme="primary">
          <StyledTab name="Create" />
          <StyledTab name="Fix" />
        </StyledTab.List>
        <div className="mb-4 mt-2">
          <StyledTab.Panels>
            <StyledTab.Panel>
              <StyledTextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here"
                rows={10}
                minRows={10}
              />
            </StyledTab.Panel>
            <StyledTab.Panel>
              <StyledTextArea
                ref={editRef}
                value={squiggleCode}
                onChange={(e) => setSquiggleCode(e.target.value)}
                placeholder="Enter your Squiggle code here"
                rows={12}
                minRows={12}
              />
            </StyledTab.Panel>
          </StyledTab.Panels>
        </div>
      </StyledTab.Group>
      <Button theme="primary" wide onClick={handleSubmit}>
        Send
      </Button>
      <div className="mt-4 flex-grow overflow-y-auto">
        <h2 className="mb-2 text-sm font-bold">Actions</h2>
        <div className="flex flex-col space-y-2">
          {workflows.map((workflow) => (
            <WorkflowSummaryItem
              key={workflow.id}
              workflow={workflow}
              onSelect={() => selectWorkflow(workflow.id)}
              isSelected={workflow.id === selectedWorkflow?.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
