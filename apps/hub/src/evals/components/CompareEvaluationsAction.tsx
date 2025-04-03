"use client";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  DropdownMenuModalActionItem,
  EmptyIcon,
  SelectFormField,
  useCloseDropdown,
} from "@quri/ui";

import { FormModal } from "@/components/ui/FormModal";
import { compareEvaluationsRoute } from "@/lib/routes";

type Props = {
  questionSetId: string;
  questionSetName: string;
};

type EvaluationOption = {
  id: string;
  agent: {
    name: string;
  };
  createdAt: string;
};

type FormShape = {
  first: EvaluationOption | null;
  second: EvaluationOption | null;
};

const SelectEvaluation: FC<{
  name: "first" | "second";
  label: string;
  evaluations: EvaluationOption[];
}> = ({ name, label, evaluations }) => {
  return (
    <SelectFormField<FormShape, EvaluationOption | null>
      name={name}
      label={label}
      options={evaluations}
      required
      placeholder="Select an evaluation"
      getOptionLabel={(option) => option.agent.name}
      getOptionValue={(option) => option.id}
    />
  );
};

const CompareEvaluationsModal: FC<Props> = ({
  questionSetId,
  questionSetName,
}) => {
  const router = useRouter();

  const form = useForm<FormShape>();

  const [evaluations, setEvaluations] = useState<EvaluationOption[] | null>(
    null
  );

  const onSubmit = form.handleSubmit((data) => {
    console.log(data);
    if (!data.first || !data.second) {
      return;
    }

    router.push(
      compareEvaluationsRoute({
        ids: [data.first.id, data.second.id],
      })
    );
  });

  useEffect(() => {
    (async () => {
      const result = await fetch(
        `/api/find-evaluations?${new URLSearchParams({
          questionSetId,
        })}`
      ).then((r) => r.json());

      const data = z
        .array(
          z.object({
            id: z.string(),
            agent: z.object({
              name: z.string(),
            }),
            createdAt: z.string(),
          })
        )
        .parse(result);

      setEvaluations(data);
    })();
  }, [questionSetId]);

  const closeDropdown = useCloseDropdown();

  return (
    <FormModal<FormShape>
      form={form}
      title={`Select Evaluations for ${questionSetName}`}
      close={closeDropdown}
      submitText="Compare"
      onSubmit={onSubmit}
    >
      {evaluations !== null && evaluations.length === 0 ? (
        <div className="my-4 text-red-600">
          No evaluations found for this question set.
        </div>
      ) : (
        <div>
          {evaluations ? (
            <div className="space-y-4">
              <SelectEvaluation
                name="first"
                label="First Evaluation"
                evaluations={evaluations}
              />
              <SelectEvaluation
                name="second"
                label="Second Evaluation"
                evaluations={evaluations}
              />
            </div>
          ) : (
            "Loading..."
          )}
        </div>
      )}
    </FormModal>
  );
};

export const CompareEvaluationsAction: FC<Props> = ({
  questionSetId,
  questionSetName,
}) => {
  return (
    <DropdownMenuModalActionItem
      title="Compare Evaluations..."
      icon={EmptyIcon}
      render={() => (
        <div className="p-4">
          <CompareEvaluationsModal
            questionSetId={questionSetId}
            questionSetName={questionSetName}
          />
        </div>
      )}
    />
  );
};
