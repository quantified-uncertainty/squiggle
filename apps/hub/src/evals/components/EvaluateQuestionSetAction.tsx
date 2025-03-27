"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { DropdownMenuModalActionItem, PlayIcon } from "@quri/ui";

import { SafeActionFormModal } from "@/components/ui/SafeActionFormModal";
import { evaluateQuestionSet } from "@/evals/actions/evaluateQuestionSet";
import { evaluationRoute } from "@/lib/routes";

import {
  SelectEpistemicAgent,
  SelectEpistemicAgentOption,
} from "./SelectEpistemicAgent";

type FormShape = { agent: SelectEpistemicAgentOption | null };

type Props = {
  questionSetId: string;
  questionSetName: string;
};

export const EvaluateQuestionSetAction: FC<Props> = ({
  questionSetId,
  questionSetName,
}) => {
  const router = useRouter();

  return (
    <DropdownMenuModalActionItem
      title="Evaluate..."
      icon={PlayIcon}
      render={({ close }) => (
        <SafeActionFormModal<FormShape, typeof evaluateQuestionSet>
          close={close}
          title={`Evaluate ${questionSetName}`}
          submitText="Start Evaluation"
          defaultValues={{
            agent: null,
          }}
          action={evaluateQuestionSet}
          formDataToInput={(data) => ({
            questionSetId,
            agentId: data.agent?.id || "",
          })}
          onSuccess={({ id }) => {
            router.push(evaluationRoute({ id }));
          }}
          initialFocus="agent"
        >
          <div className="mb-4">
            <div className="mb-4">
              This will evaluate all questions in this question set using the
              selected epistemic agent. This process may take some time
              depending on the number of questions.
            </div>
            <SelectEpistemicAgent<FormShape>
              name="agent"
              label="Epistemic Agent"
              required
            />
          </div>
        </SafeActionFormModal>
      )}
    />
  );
};
