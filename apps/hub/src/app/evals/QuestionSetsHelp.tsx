import { FC } from "react";

import { ModalHelp } from "@/components/ui/ModalHelp";
import { StyledLink } from "@/components/ui/StyledLink";
import { epistemicAgentsRoute, evaluationsRoute } from "@/lib/routes";

export const QuestionSetsHelp: FC = () => {
  return (
    <ModalHelp
      title="About Question Sets"
      body={
        <div>
          <p>
            Question sets are the lists of questions.{" "}
            <StyledLink href={evaluationsRoute()}>Evaluations</StyledLink> are
            produced from question sets by evaluating some question set with an{" "}
            <StyledLink href={epistemicAgentsRoute()}>
              epistemic agent
            </StyledLink>
            .
          </p>
        </div>
      }
    />
  );
};
