"use client";

import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider } from "react-hook-form";

import { DEFAULT_LLM_ID, LlmId, UI_VISIBLE_MODELS } from "@quri/squiggle-ai";
import {
  Button,
  NumberFormField,
  SelectFormField,
  TextFormField,
} from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { createSquiggleAiEpistemicAgentAction } from "@/evals/actions/createSquiggleAiEpistemicAgent";
import { epistemicAgentRoute } from "@/lib/routes";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";

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
  modelConfig: (typeof UI_VISIBLE_MODELS)[number]
): LlmOption => ({
  value: modelConfig.id,
  label: `${modelConfig.name} (${modelConfig.provider})`,
});

export default function CreateEpistemicAgentPage() {
  const router = useRouter();

  const sonnetLlm = UI_VISIBLE_MODELS.find((m) => m.id === DEFAULT_LLM_ID)!;
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

  const { form, onSubmit, inFlight } = useSafeActionForm<
    FormShape,
    typeof createSquiggleAiEpistemicAgentAction
  >({
    defaultValues,
    mode: "onChange",
    blockOnSuccess: true,
    formDataToInput: (data) => ({
      name: data.name,
      config: {
        llmId: data.config.llm.value,
        priceLimit: Number(data.config.priceLimit),
        durationLimitMinutes: Number(data.config.durationLimitMinutes),
        messagesInHistoryToKeep: Number(data.config.messagesInHistoryToKeep),
        numericSteps: Number(data.config.numericSteps),
        styleGuideSteps: Number(data.config.styleGuideSteps),
      },
    }),
    action: createSquiggleAiEpistemicAgentAction,
    onSuccess(result) {
      router.push(epistemicAgentRoute({ id: result.id }));
    },
  });

  return (
    <Card theme="big">
      <FormProvider {...form}>
        <form onSubmit={onSubmit}>
          <div className="space-y-6">
            <TextFormField<FormShape>
              name="name"
              label="Epistemic Agent Name"
              placeholder="Enter a name for this epistemic agent"
              rules={{ required: "Name is required" }}
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
                  options={UI_VISIBLE_MODELS.map((model) => ({
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

            <div className="mt-6">
              <Button
                type="submit"
                theme="primary"
                disabled={!form.formState.isValid || inFlight}
              >
                {inFlight ? "Creating..." : "Create Epistemic Agent"}
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}
