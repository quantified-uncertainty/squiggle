"use client";
import { FC } from "react";

import { LlmConfig, MODEL_CONFIGS } from "@quri/squiggle-ai";

export const EvaluatorConfigDisplay: FC<{
  config: LlmConfig;
}> = ({ config }) => {
  // Find the model details to display model name instead of just ID
  const modelConfig = MODEL_CONFIGS.find((model) => model.id === config.llmId);

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
        <div>
          <div className="font-medium text-gray-500">Model</div>
          <div>
            <span className="font-semibold">
              {modelConfig?.name || config.llmId}
            </span>
            <span className="ml-1 text-sm text-gray-500">
              ({modelConfig?.provider || "unknown"})
            </span>
          </div>
        </div>

        <div>
          <div className="font-medium text-gray-500">Price Limit</div>
          <div className="font-semibold">${config.priceLimit.toFixed(2)}</div>
        </div>

        <div>
          <div className="font-medium text-gray-500">Duration Limit</div>
          <div className="font-semibold">
            {config.durationLimitMinutes} minutes
          </div>
        </div>

        <div>
          <div className="font-medium text-gray-500">Messages in History</div>
          <div className="font-semibold">{config.messagesInHistoryToKeep}</div>
        </div>

        <div>
          <div className="font-medium text-gray-500">Numeric Steps</div>
          <div className="font-semibold">{config.numericSteps}</div>
        </div>

        <div>
          <div className="font-medium text-gray-500">Style Guide Steps</div>
          <div className="font-semibold">{config.styleGuideSteps}</div>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <details>
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            View Raw Configuration
          </summary>
          <div className="mt-2 overflow-auto rounded bg-gray-50 p-4">
            <pre className="text-sm text-gray-800">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
};
