"use client";

import { useRouter } from "next/navigation";
import { FormProvider } from "react-hook-form";

import { Button, TextFormField } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { createQuestionSetAction } from "@/evals/actions/createQuestionSetAction";
import { QuestionsFieldArray } from "@/evals/components/QuestionsFieldArray";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";
import { questionSetRoute } from "@/lib/routes";

type FormShape = {
  name: string;
  questions: {
    description: string;
  }[];
};

export default function CreateQuestionSetPage() {
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

          <QuestionsFieldArray name="questions" />

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
  );
}
