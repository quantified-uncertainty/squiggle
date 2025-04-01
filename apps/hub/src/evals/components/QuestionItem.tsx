"use client";

import { FC, useState } from "react";

import { Button } from "@quri/ui";

import { QuestionDTO } from "../data/questions";

type Props = {
  question: QuestionDTO;
};

export const QuestionItem: FC<Props> = ({ question }) => {
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
        <div className="whitespace-pre-wrap text-xs text-gray-500">
          {question.description.split("\n").slice(1).join("\n")}
        </div>
      )}
      {question.metadata?.manifold && (
        <div>
          <a
            href={question.metadata.manifold.marketUrl}
            target="_blank"
            className="rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-200"
            rel="noopener noreferrer"
          >
            Manifold
          </a>
        </div>
      )}
    </div>
  );
};
