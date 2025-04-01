"use client";

import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";

import { Button, TextFormField } from "@quri/ui";

import { Card } from "@/components/ui/Card";
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
      <div className="mb-6 rounded-md bg-blue-50 p-4 text-sm text-blue-800">
        <p className="mb-2 font-medium">About Manifold Agents</p>
        <p>
          Manifold agents snapshot the current forecasted or resolved values
          from Manifold Markets when used in an evaluation.
        </p>
      </div>

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
