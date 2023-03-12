import { SquiggleEditor } from "@quri/squiggle-components";
import { FC } from "react";
import { StyledTab } from "../ui/StyledTab";
import { View } from "../View";
import {
  DashboardProvider,
  useDashboardContext,
  useDashboardDispatch,
} from "./DashboardProvider";

// TODO - move to a separate file
const Estimate: FC<{ code: string; setCode: (code: string) => void }> = ({
  code,
  setCode,
}) => {
  // TODO - autosize
  // TODO - syntax highlight
  return <SquiggleEditor code={code} onCodeChange={(code) => setCode(code)} />;
};

const InnerDashboard: FC = () => {
  const { code } = useDashboardContext();
  const dispatch = useDashboardDispatch();

  return (
    <StyledTab.Group>
      <div className="mb-4">
        <StyledTab.List>
          <StyledTab name="Estimate" icon={() => <div />} />
          <StyledTab name="View" icon={() => <div />} />
        </StyledTab.List>
      </div>
      <StyledTab.Panels>
        <StyledTab.Panel>
          <Estimate
            code={code}
            setCode={(value) => dispatch({ type: "setCode", payload: value })}
          />
        </StyledTab.Panel>
        <StyledTab.Panel>
          <View code={code} />
        </StyledTab.Panel>
      </StyledTab.Panels>
    </StyledTab.Group>
  );
};

export const Dashboard: FC = () => {
  return (
    <DashboardProvider>
      <InnerDashboard />
    </DashboardProvider>
  );
};
