"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { DropdownMenuModalActionItem, TrashIcon } from "@quri/ui";

import { SafeActionFormModal } from "@/components/ui/SafeActionFormModal";
import { questionSetsRoute } from "@/lib/routes";

import { deleteQuestionSet } from "../actions/deleteQuestionSet";
import { SelectEpistemicAgentOption } from "./SelectEpistemicAgent";

type FormShape = { agent: SelectEpistemicAgentOption | null };

type Props = {
  questionSetId: string;
  questionSetName: string;
};

export const DeleteQuestionSetAction: FC<Props> = ({
  questionSetId,
  questionSetName,
}) => {
  const router = useRouter();

  return (
    <DropdownMenuModalActionItem
      title="Delete"
      icon={TrashIcon}
      render={({ close }) => (
        <SafeActionFormModal<FormShape, typeof deleteQuestionSet>
          close={close}
          title={`Delete ${questionSetName}`}
          submitText="Delete Question Set"
          action={deleteQuestionSet}
          formDataToInput={() => ({
            questionSetId,
          })}
          onSuccess={() => {
            router.push(questionSetsRoute());
          }}
        >
          This will delete the question set and all associated questions.
        </SafeActionFormModal>
      )}
    />
  );
};
