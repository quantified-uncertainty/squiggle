"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { LlmId, MODEL_CONFIGS } from "@quri/squiggle-ai";
import { NumberFormField, SelectFormField, TextFormField } from "@quri/ui";

import { SafeActionFormModal } from "@/components/ui/SafeActionFormModal";
import { createEpistemicAgentAction } from "@/evals/actions/createEpistemicAgent";
import { epistemicAgentRoute } from "@/lib/routes";

type LlmOption = {
  value: LlmId;
  label: string;
};

type FormShape = {
  name: string;
  config: {
    llm: LlmOption;
    priceLimit: number;
    durationLimitMinutes: number;
    messagesInHistoryToKeep: number;
    numericSteps: number;
    styleGuideSteps: number;
  };
};

const modelConfigToOption = (
  modelConfig: (typeof MODEL_CONFIGS)[number]
): LlmOption => ({
  value: modelConfig.id,
  label: `${modelConfig.name} (${modelConfig.provider})`,
});

type Props = {
  close: () => void;
};

export const CreateEpistemicAgentModal: FC<Props> = ({ close }) => {
  const router = useRouter();

  const sonnetLlm = MODEL_CONFIGS.find((m) => m.id === "Claude-Sonnet")!;
  const defaultValues: FormShape = {
    name: "",
    config: {
      llm: modelConfigToOption(sonnetLlm),
      priceLimit: 5,
      durationLimitMinutes: 10,
      messagesInHistoryToKeep: 5,
      numericSteps: 1,
      styleGuideSteps: 1,
    },
  };

  return (
    <SafeActionFormModal<FormShape, typeof createEpistemicAgentAction>
      close={close}
      title="Create New Epistemic Agent"
      submitText="Create"
      defaultValues={defaultValues}
      action={createEpistemicAgentAction}
      formDataToInput={(data) => ({
        name: data.name,
        config: {
          llmId: data.config.llm.value,
          priceLimit: Number(data.config.priceLimit),
          durationLimitMinutes: Number(data.config.durationLimitMinutes),
          messagesInHistoryToKeep: Number(data.config.messagesInHistoryToKeep),
          numericSteps: Number(data.config.numericSteps),
          styleGuideSteps: Number(data.config.styleGuideSteps),
        },
      })}
      onSuccess={({ id }) => {
        router.push(epistemicAgentRoute({ id }));
      }}
      initialFocus="name"
    >
      <div className="space-y-6">
        <TextFormField<FormShape>
          name="name"
          label="Epistemic Agent Name"
          placeholder="Enter a name for this epistemic agent"
        />

        <div className="border-t border-gray-200 pt-4">
          <h3 className="mb-4 text-sm font-medium text-gray-700">
            LLM Configuration
          </h3>

          <div className="space-y-4">
            <SelectFormField<
              FormShape,
              {
                value: LlmId;
                label: string;
              }
            >
              label="Model"
              description="Select the LLM to use for evaluations"
              name="config.llm"
              options={MODEL_CONFIGS.map((model) => ({
                value: model.id,
                label: `${model.name} (${model.provider})`,
              }))}
              required
            />

            <NumberFormField<FormShape>
              name="config.priceLimit"
              label="Price Limit ($)"
              description="Maximum cost allowed for a single evaluation"
              rules={{ required: true }}
            />

            <NumberFormField<FormShape>
              name="config.durationLimitMinutes"
              label="Duration Limit (minutes)"
              description="Maximum time allowed for a single evaluation"
              rules={{ required: true }}
            />

            <NumberFormField<FormShape>
              name="config.messagesInHistoryToKeep"
              label="Messages History"
              description="Number of previous messages to keep in context"
              rules={{ min: 0, required: true }}
            />

            <NumberFormField<FormShape>
              name="config.numericSteps"
              label="Numeric Steps"
              description="Number of steps to improve numerical calculations"
              rules={{ min: 0, required: true }}
            />

            <NumberFormField<FormShape>
              name="config.styleGuideSteps"
              label="Style Guide Steps"
              description="Number of steps to improve documentation and formatting"
              rules={{ min: 0, required: true }}
            />
          </div>
        </div>
      </div>
    </SafeActionFormModal>
  );
};
