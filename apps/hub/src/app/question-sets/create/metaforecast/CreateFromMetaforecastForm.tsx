"use client";

import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider } from "react-hook-form";

import { Button, TextFormField } from "@quri/ui";

import { Card } from "@/components/ui/Card";
import { H2 } from "@/components/ui/Headers";
import { createQuestionSetFromMetaforecastAction } from "@/evals/actions/createQuestionSetFromMetaforecastAction";
import { useSafeActionForm } from "@/lib/hooks/useSafeActionForm";
import { questionSetRoute } from "@/lib/routes";
import { Paginated } from "@/lib/types";
import { QuestionDTO } from "@/metaforecast-questions/data/manifold-questions";

import { ManifoldMarketsList } from "./ManifoldMarketsList";

export const CreateFromMetaforecastForm: FC<{
  page: Paginated<QuestionDTO>;
}> = ({ page }) => {
  const router = useRouter();

  type FormShape = {
    name: string;
  };

  const { form, onSubmit, inFlight } = useSafeActionForm<
    FormShape,
    typeof createQuestionSetFromMetaforecastAction
  >({
    defaultValues: {
      name: "",
    },
    mode: "onChange",
    blockOnSuccess: true,
    formDataToInput: (data) => ({
      name: data.name,
      manifoldMarketIds: page.items.map((item) => item.id), // TODO
    }),
    action: createQuestionSetFromMetaforecastAction,
    onSuccess(result) {
      router.push(questionSetRoute({ id: result.id }));
    },
  });

  return (
    <Card theme="big">
      <FormProvider {...form}>
        <form onSubmit={onSubmit}>
          <div className="space-y-6">
            <TextFormField<FormShape>
              name="name"
              label="Question Set Name"
              placeholder="Enter a name for this question set"
              rules={{ required: "Name is required" }}
            />
            <div>
              <H2>Questions</H2>
              <ManifoldMarketsList page={page} />
            </div>
            <Button
              type="submit"
              theme="primary"
              disabled={!form.formState.isValid || inFlight}
            >
              {inFlight ? "Creating..." : "Create Question Set"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
};
