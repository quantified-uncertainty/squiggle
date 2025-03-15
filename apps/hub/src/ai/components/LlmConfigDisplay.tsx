"use client";
import { FC } from "react";

import { LlmConfig, MODEL_CONFIGS } from "@quri/squiggle-ai";

import { KeyValue } from "@/components/ui/KeyValue";

export const LlmConfigDisplay: FC<{
  config: LlmConfig;
}> = ({ config }) => {
  // Find the model details to display model name instead of just ID
  const modelConfig = MODEL_CONFIGS.find((model) => model.id === config.llmId);

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
        <KeyValue
          name="Model"
          value={
            <div>
              <span className="font-semibold">
                {modelConfig?.name || config.llmId}
              </span>
              <span className="ml-1 text-sm text-gray-500">
                ({modelConfig?.provider || "unknown"})
              </span>
            </div>
          }
        />

        <KeyValue
          name="Price Limit"
          value={`$${config.priceLimit.toFixed(2)}`}
        />

        <KeyValue
          name="Duration Limit"
          value={`${config.durationLimitMinutes} minutes`}
        />

        <KeyValue
          name="Messages in History"
          value={config.messagesInHistoryToKeep.toString()}
        />

        <KeyValue name="Numeric Steps" value={config.numericSteps.toString()} />

        <KeyValue
          name="Style Guide Steps"
          value={config.styleGuideSteps.toString()}
        />
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
