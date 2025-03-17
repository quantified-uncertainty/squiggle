"use client";
import React, { FC } from "react";

import { EvaluationState } from "@quri/hub-db";
import { TextTooltip } from "@quri/ui";

export const EvaluationStateDisplay: FC<{
  state: EvaluationState;
  errorMsg?: string | null;
}> = ({ state, errorMsg }) => {
  let className = "";
  let label = state;

  switch (state) {
    case "Pending":
      className = "bg-yellow-100 text-yellow-800";
      break;
    case "Running":
      className = "bg-blue-100 text-blue-800";
      break;
    case "Completed":
      className = "bg-green-100 text-green-800";
      break;
    case "Failed":
      className = "bg-red-100 text-red-800";
      break;
  }

  const stateElement = (
    <span
      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${className}`}
    >
      {label}
    </span>
  );

  // If there's an error message and state is Failed, show it in a tooltip
  if (state === "Failed" && errorMsg) {
    return <TextTooltip text={errorMsg}>{stateElement}</TextTooltip>;
  }

  return stateElement;
};
