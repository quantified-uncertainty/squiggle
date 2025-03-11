"use client";

import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";

import { Button, TextFormField } from "@quri/ui";

import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { createSpecListAction } from "@/evals/actions/createSpecListAction";
import { SpecsFieldArray } from "@/evals/components/SpecsFieldArray";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";
import { speclistRoute, speclistsRoute } from "@/lib/routes";

type FormShape = {
  name: string;
  specs: {
    description: string;
  }[];
};

export default function CreateSpecListPage() {
  const router = useRouter();

  const { form, onSubmit, inFlight } = useSafeActionForm<
    FormShape,
    typeof createSpecListAction
  >({
    defaultValues: {
      name: "",
      specs: [{ description: "" }],
    },
    mode: "onChange",
    blockOnSuccess: true,
    formDataToInput: (data) => data,
    action: createSpecListAction,
    onSuccess(result) {
      router.push(speclistRoute({ id: result.id }));
    },
  });

  const isValid =
    form.formState.isValid &&
    form.getValues().specs.some((spec) => spec.description.trim() !== "");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <H2>Create New Spec List</H2>
        <StyledLink href={speclistsRoute()}>← Back to Spec Lists</StyledLink>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <FormProvider {...form}>
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <TextFormField
                name="name"
                label="Spec List Name"
                placeholder="Enter a name for this spec list"
                rules={{ required: "Name is required" }}
              />
            </div>

            <SpecsFieldArray name="specs" />

            <div className="mt-6">
              <Button
                type="submit"
                theme="primary"
                disabled={!isValid || inFlight}
              >
                {inFlight ? "Creating..." : "Create Spec List"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
