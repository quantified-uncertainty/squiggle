"use client";
import { FC } from "react";

import { useProgress } from "../host/core.js";
import { usePresentation } from "../host/presentation.js";
import { DefaultProgress, renderSlot } from "../host/slots.js";

/**
 * The provider's progress (through the `Progress` slot), while pairs are
 * computed; renders nothing otherwise.
 */
export const RelativeValuesProgressBar: FC<{
  className?: string;
  variant?: "blocking" | "compact";
}> = ({ className, variant = "compact" }) => {
  const progress = useProgress();
  const { components } = usePresentation();
  if (!progress) {
    return null;
  }
  return (
    <div className={className}>
      {renderSlot(components.Progress, DefaultProgress, { progress, variant })}
    </div>
  );
};
