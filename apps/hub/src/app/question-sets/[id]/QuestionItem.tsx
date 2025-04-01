"use client";

import { FC, useState } from "react";

import { Button } from "@quri/ui";

import { QuestionSet } from "@/evals/data/questionSets";

export const QuestionItem: FC<{
  question: QuestionSet["questions"][number]["question"];
}> = ({ question }) => {
  const firstLine = question.description.split("\n")[0];
  const isMultiline = question.description.split("\n").length > 1;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col space-y-1">
      <div className="text-xs text-gray-500">ID: {question.id}</div>
      <div className="flex gap-1">
        <div className="text-sm font-medium text-gray-900">{firstLine}</div>
        {!expanded && isMultiline && (
          <Button size="small" onClick={() => setExpanded(true)}>
            ...
          </Button>
        )}
      </div>
      {expanded && (
        <div className="whitespace-pre text-xs text-gray-500">
          {question.description.split("\n").slice(1).join("\n")}
        </div>
      )}
    </div>
  );
};
