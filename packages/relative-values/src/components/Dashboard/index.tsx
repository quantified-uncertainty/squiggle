import { FC } from "react";
import { Catalog } from "../Catalog";
import { Estimate } from "../Estimate";
import { StyledTab } from "../ui/StyledTab";
import { View } from "../View";
import {
  DashboardProvider,
  useDashboardContext,
  useDashboardDispatch,
} from "./DashboardProvider";

const InnerDashboard: FC = () => {
  const { code } = useDashboardContext();
  const dispatch = useDashboardDispatch();

  return (
    <StyledTab.Group>
      <div className="mb-4">
        <StyledTab.List>
          <StyledTab name="Catalog" icon={() => <div />} />
          <StyledTab name="Estimate" icon={() => <div />} />
          <StyledTab name="View" icon={() => <div />} />
        </StyledTab.List>
      </div>
      <StyledTab.Panels>
        <StyledTab.Panel>
          <Catalog />
        </StyledTab.Panel>
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
