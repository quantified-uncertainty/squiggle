"use client";

import { FC, useState } from "react";

import { ChevronDownIcon, ChevronRightIcon } from "@quri/ui";

import { QuestionDTO } from "../data/questions";

type Props = {
  question: QuestionDTO;
};

const ExpandableIcon: FC<{ expanded: boolean; onClick: () => void }> = ({
  expanded,
  onClick,
}) => {
  const Icon = expanded ? ChevronDownIcon : ChevronRightIcon;
  return (
    <Icon
      className="h-5 w-5 cursor-pointer text-gray-500 hover:text-gray-700"
      onClick={onClick}
    />
  );
};

export const QuestionItem: FC<Props> = ({ question }) => {
  const firstLine = question.description.split("\n")[0];
  const isMultiline = question.description.split("\n").length > 1;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center gap-2">
        <div className="text-xs leading-none text-gray-500">
          ID: {question.id}
        </div>
        {question.metadata?.manifold && (
          <a
            href={question.metadata.manifold.marketUrl}
            target="_blank"
            className="rounded-md bg-blue-100 px-2 text-xs text-blue-700 hover:bg-blue-200"
            rel="noopener noreferrer"
          >
            Manifold
          </a>
        )}
      </div>
      <div className="flex items-center gap-1">
        <div className="text-sm font-medium text-gray-900">{firstLine}</div>
        {isMultiline && (
          <ExpandableIcon
            expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          />
        )}
      </div>
      {expanded && (
        <div className="whitespace-pre-wrap text-xs text-gray-500">
          {question.description.split("\n").slice(1).join("\n")}
        </div>
      )}
    </div>
  );
};
