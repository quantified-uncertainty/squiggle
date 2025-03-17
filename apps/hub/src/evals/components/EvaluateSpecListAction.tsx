"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { DropdownMenuModalActionItem, PlayIcon } from "@quri/ui";

import { SafeActionFormModal } from "@/components/ui/SafeActionFormModal";
import { evaluateSpecList } from "@/evals/actions/evaluateSpeclist";
import { evaluationRoute } from "@/lib/routes";

import { SelectEvalRunner, SelectEvalRunnerOption } from "./SelectEvalRunner";

type FormShape = { runner: SelectEvalRunnerOption | null };

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
            runner: null,
          }}
          action={evaluateSpecList}
          formDataToInput={(data) => ({
            specListId,
            runnerId: data.runner?.id || "",
          })}
          onSuccess={({ id }) => {
            router.push(evaluationRoute({ id }));
          }}
          initialFocus="runner"
        >
          <div className="mb-4">
            <div className="mb-4">
              This will evaluate all specs in this spec list using the selected
              eval runner. This process may take some time depending on the
              number of specs.
            </div>
            <SelectEvalRunner<FormShape>
              name="runner"
              label="Eval Runner"
              required
            />
          </div>
        </SafeActionFormModal>
      )}
    />
  );
};
