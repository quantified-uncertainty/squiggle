"use client";
import { FC } from "react";

import { Button, Dropdown, DropdownMenu } from "@quri/ui";

import { EvaluateQuestionSetAction } from "./EvaluateSpecListAction";

type Props = {
  questionSetId: string;
  questionSetName: string;
};

export const QuestionSetActionsButton: FC<Props> = ({
  questionSetId,
  questionSetName,
}) => {
  return (
    <Dropdown
      render={() => (
        <DropdownMenu>
          <EvaluateQuestionSetAction
            questionSetId={questionSetId}
            questionSetName={questionSetName}
          />
        </DropdownMenu>
      )}
    >
      <Button>Actions...</Button>
    </Dropdown>
  );
};
