"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { DropdownMenuModalActionItem, PlayIcon } from "@quri/ui";

import { SafeActionFormModal } from "@/components/ui/SafeActionFormModal";
import { evaluateSpecList } from "@/evals/actions/evaluateSpeclist";
import { evaluationRoute } from "@/lib/routes";

import { SelectEvaluator, SelectEvaluatorOption } from "./SelectEvaluator";

type FormShape = { evaluator: SelectEvaluatorOption | null };

type Props = {
  specListId: string;
  specListName: string;
};

export const EvaluateSpecListAction: FC<Props> = ({
  specListId,
  specListName,
}) => {
  const router = useRouter();

  return (
    <DropdownMenuModalActionItem
      title="Evaluate..."
      icon={PlayIcon}
      render={({ close }) => (
        <SafeActionFormModal<FormShape, typeof evaluateSpecList>
          close={close}
          title={`Evaluate ${specListName}`}
          submitText="Start Evaluation"
          defaultValues={{
            evaluator: null,
          }}
          action={evaluateSpecList}
          formDataToInput={(data) => ({
            specListId,
            evaluatorId: data.evaluator?.id || "",
          })}
          onSuccess={({ id }) => {
            router.push(evaluationRoute({ id }));
          }}
          initialFocus="evaluator"
        >
          <div className="mb-4">
            <div className="mb-4">
              This will evaluate all specs in this spec list using the selected
              evaluator. This process may take some time depending on the number
              of specs.
            </div>
            <SelectEvaluator<FormShape>
              name="evaluator"
              label="Evaluator"
              required
            />
          </div>
        </SafeActionFormModal>
      )}
    />
  );
};
