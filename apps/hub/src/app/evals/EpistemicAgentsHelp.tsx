import { FC } from "react";

import { ModalHelp } from "@/components/ui/ModalHelp";
import { StyledLink } from "@/components/ui/StyledLink";
import { evaluationsRoute, questionSetsRoute } from "@/lib/routes";

export const EpistemicAgentsHelp: FC = () => {
  return (
    <ModalHelp
      title="About Epistemic Agents"
      body={
        <div>
          <p>
            Epistemic agents are procedures that convert{" "}
            <StyledLink href={questionSetsRoute()}>question sets</StyledLink>{" "}
            into sets of values (
            <StyledLink href={evaluationsRoute()}>evaluations</StyledLink>).
          </p>
          <p className="mt-2">
            Agents can be automatic, like Squiggle AI, or manual, like prompting
            a user to enter their own estimations for each question.
          </p>
        </div>
      }
    />
  );
};
