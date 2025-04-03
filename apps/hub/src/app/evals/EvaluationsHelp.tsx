import { FC } from "react";

import { ModalHelp } from "@/components/ui/ModalHelp";
import { StyledLink } from "@/components/ui/StyledLink";
import { epistemicAgentsRoute, questionSetsRoute } from "@/lib/routes";

export const EvaluationsHelp: FC = () => {
  return (
    <ModalHelp
      title="About Evaluations"
      body={
        <div>
          <p>
            Evaluations are the sets of values produced by an{" "}
            <StyledLink href={epistemicAgentsRoute()}>
              epistemic agent
            </StyledLink>
            .
          </p>
          <p className="mt-2">
            Evaluations can be used to organize forecasts, estimate some
            parameter on a list of similar entities, compare the quality of
            epistemic agents, run contests like {`QURI's `}
            <StyledLink href="https://forum.effectivealtruism.org/posts/Zc5jki9nXihueDcKj/usd300-fermi-model-competition">
              Fermi Model Competition
            </StyledLink>
            , and more.
          </p>
          <p className="mt-2">
            To produce an evaluation, you need to create a{" "}
            <StyledLink href={questionSetsRoute()}>question set</StyledLink> and
            then evalaute it with some{" "}
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
