import { getModelCode } from "@/model/utils";
import { FC, useState } from "react";
import { Catalog } from "../Catalog";
import { Estimate } from "../Estimate";
import { A } from "../ui/A";
import { Button } from "../ui/Button";
import { StyledTab } from "../ui/StyledTab";
import { View } from "../View";
import { useDashboardContext, useDashboardDispatch } from "./DashboardProvider";
import { Toolbar } from "./Toolbar";

// need to be wrapped in DashboardProvider
export const Dashboard: FC = () => {
  const { model } = useDashboardContext();
  const dispatch = useDashboardDispatch();

  return (
    <StyledTab.Group>
      <div className="mb-4 flex items-center justify-between">
        <StyledTab.List>
          <StyledTab name="Interface" icon={() => <div />} />
          <StyledTab name="Estimate" icon={() => <div />} />
          <StyledTab name="View" icon={() => <div />} />
        </StyledTab.List>
        <Toolbar />
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
