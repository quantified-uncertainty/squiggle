import { FC, useState } from "react";
import { GridViewProvider } from "./GridView/GridViewProvider";
import { useRelativeValues } from "./hooks";
import { GridView } from "./GridView";
import { useDashboardContext } from "../Dashboard/DashboardProvider";
import { StyledTab } from "../ui/StyledTab";
import { ListView } from "./ListView";

type Props = {
  code: string;
};

export const View: FC<Props> = ({ code }) => {
  // TODO - store most of these in context? they're all global
  const { error, fn, project } = useRelativeValues(code);
  const {
    catalog: { items: choices, clusters },
  } = useDashboardContext();

  return (
    <GridViewProvider initialClusters={clusters}>
      {error && <pre className="text-red-700">{error}</pre>}
      <StyledTab.Group>
        <div className="mb-4">
          <StyledTab.List>
            <StyledTab name="List" icon={() => <div />} />
            <StyledTab name="Grid" icon={() => <div />} />
          </StyledTab.List>
        </div>
        <StyledTab.Panels>
          <StyledTab.Panel>
            {fn ? <ListView fn={fn} project={project} /> : null}
          </StyledTab.Panel>
          <StyledTab.Panel>
            {fn ? <GridView fn={fn} project={project} /> : null}
          </StyledTab.Panel>
        </StyledTab.Panels>
      </StyledTab.Group>
    </GridViewProvider>
  );
};
