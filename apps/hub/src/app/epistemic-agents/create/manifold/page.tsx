"use client";

import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";

import { Button, TextFormField } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { ExplanationBox } from "@/components/ui/ExplanationBox";
import { StyledA } from "@/components/ui/StyledA";
import { createManifoldEpistemicAgentAction } from "@/evals/actions/createManifoldEpistemicAgent";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";
import { epistemicAgentRoute } from "@/lib/routes";

type FormShape = {
  name: string;
};

export default function CreateManifoldEpistemicAgentPage() {
  const router = useRouter();

  const { form, onSubmit, inFlight } = useSafeActionForm<
    FormShape,
    typeof createManifoldEpistemicAgentAction
  >({
    defaultValues: {
      name: "",
    },
    mode: "onChange",
    blockOnSuccess: true,
    formDataToInput: (data) => ({
      name: data.name,
    }),
    action: createManifoldEpistemicAgentAction,
    onSuccess(result) {
      router.push(epistemicAgentRoute({ id: result.id }));
    },
  });

  return (
    <Card theme="big">
      <ExplanationBox title="About Manifold Agents">
        <p className="mb-2">
          Manifold agents snapshot the current forecasted or resolved values
          from Manifold Markets when used in an evaluation. The values are
          loaded from the{" "}
          <StyledA href="https://metaforecast.org" target="_blank">
            Metaforecast
          </StyledA>{" "}
          database.
        </p>
        <p className="mb-2">
          {`Manifold agents don't have any configuration. So you won't need more than one agent of this type.`}
        </p>
      </ExplanationBox>

      <FormProvider {...form}>
        <form onSubmit={onSubmit}>
          <div className="space-y-6">
            <TextFormField<FormShape>
              name="name"
              label="Epistemic Agent Name"
              placeholder="Enter a name for this Manifold agent"
              rules={{ required: "Name is required" }}
            />

            <div className="mt-6">
              <Button
                type="submit"
                theme="primary"
                disabled={!form.formState.isValid || inFlight}
              >
                {inFlight ? "Creating..." : "Create Manifold Agent"}
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}
