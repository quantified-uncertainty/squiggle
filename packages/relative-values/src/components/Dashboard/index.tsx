import { getModelCode } from "@/model/utils";
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
  const { model } = useDashboardContext();
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
            model={model}
            setModel={(newModel) =>
              dispatch({ type: "setModel", payload: newModel })
            }
          />
        </StyledTab.Panel>
        <StyledTab.Panel>
          <View code={getModelCode(model)} />
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
