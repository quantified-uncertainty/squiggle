import { format } from "date-fns";
import { FC } from "react";

import { Card } from "@/components/ui/Card";
import { KeyValue } from "@/components/ui/KeyValue";
import { StyledLink } from "@/components/ui/StyledLink";
import { EvaluationStateDisplay } from "@/evals/components/EvaluationStateDisplay";
import { epistemicAgentRoute, questionSetRoute } from "@/lib/routes";

import { EvalWithDetailsDTO } from "../data/detailsEvals";

interface EvaluationDetailsProps {
  evaluation: EvalWithDetailsDTO;
}

export const EvaluationDetails: FC<EvaluationDetailsProps> = ({
  evaluation,
}) => {
  return (
    <Card theme="big">
      <h3 className="mb-4 text-lg font-medium">Evaluation Details</h3>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <KeyValue name="ID" value={evaluation.id} />
        <KeyValue
          name="Created"
          value={format(new Date(evaluation.createdAt), "MMM d, yyyy h:mm a")}
        />
        <KeyValue
          name="Epistemic Agent"
          value={
            <StyledLink
              href={epistemicAgentRoute({ id: evaluation.agent.id })}
              className="text-sm"
            >
              {evaluation.agent.name}
            </StyledLink>
          }
        />
        <KeyValue
          name="Question Set"
          value={
            <StyledLink
              href={questionSetRoute({ id: evaluation.questionSet.id })}
              className="text-sm"
            >
              {evaluation.questionSet.name}
            </StyledLink>
          }
        />
        <KeyValue
          name="Results"
          value={`${evaluation.values.length} / ${evaluation.questionSet.questionCount}`}
        />
        <KeyValue
          name="State"
          value={
            <EvaluationStateDisplay
              state={evaluation.state}
              errorMsg={evaluation.errorMsg}
            />
          }
        />
      </div>
    </Card>
  );
};
