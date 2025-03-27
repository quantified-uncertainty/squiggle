"use client";

import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";

import { Button, TextFormField } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { createQuestionSetAction } from "@/evals/actions/createSpecListAction";
import { SpecsFieldArray } from "@/evals/components/SpecsFieldArray";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";
import { questionSetRoute, questionSetsRoute } from "@/lib/routes";

type FormShape = {
  name: string;
  questions: {
    description: string;
  }[];
};

export default function CreateSpecListPage() {
  const router = useRouter();

  const { form, onSubmit, inFlight } = useSafeActionForm<
    FormShape,
    typeof createQuestionSetAction
  >({
    defaultValues: {
      name: "",
      questions: [{ description: "" }],
    },
    mode: "onChange",
    blockOnSuccess: true,
    formDataToInput: (data) => data,
    action: createQuestionSetAction,
    onSuccess(result) {
      router.push(questionSetRoute({ id: result.id }));
    },
  });

  const isValid =
    form.formState.isValid &&
    form
      .getValues()
      .questions.some((question) => question.description.trim() !== "");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <H2>Create New Spec List</H2>
        <StyledLink href={questionSetsRoute()}>← Back to Spec Lists</StyledLink>
      </div>

      <Card theme="big">
        <FormProvider {...form}>
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <TextFormField
                name="name"
                label="Question Set Name"
                placeholder="Enter a name for this question set"
                rules={{ required: "Name is required" }}
              />
            </div>

            <SpecsFieldArray name="questions" />

            <div className="mt-6">
              <Button
                type="submit"
                theme="primary"
                disabled={!isValid || inFlight}
              >
                {inFlight ? "Creating..." : "Create Question Set"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
