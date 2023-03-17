import { StyledTab } from "@/components/ui/StyledTab";
import { SqLambda } from "@quri/squiggle-lang";
import { FC } from "react";
import { ClusterFilter } from "../ClusterFilter";
import { ForcePlot } from "./ForcePlot";
import { ValueAndUncertaintyPlot } from "./ValueAndUncertaintyPlot";

export const PlotView: FC<{
  fn: SqLambda;
}> = ({ fn }) => {
  return (
    <div className="flex gap-8">
      <div>
        <StyledTab.Group>
          <StyledTab.List>
            <StyledTab name="Value and Uncertainty" icon={() => <div />} />
            <StyledTab name="Force" icon={() => <div />} />
          </StyledTab.List>
          <StyledTab.Panels>
            <StyledTab.Panel>
              <ValueAndUncertaintyPlot fn={fn} />
            </StyledTab.Panel>
            <StyledTab.Panel>
              <ForcePlot fn={fn} />
            </StyledTab.Panel>
          </StyledTab.Panels>
        </StyledTab.Group>
      </div>
      <ClusterFilter axis="rows" />
    </div>
  );
};
