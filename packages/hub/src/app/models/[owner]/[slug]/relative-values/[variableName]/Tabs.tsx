"use client";

import { FC } from "react";

import { Bars4Icon, ScatterPlotIcon, TableCellsIcon } from "@quri/ui";

import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { modelForRelativeValuesExportRoute } from "@/routes";
import { ModelCardDTO } from "@/server/models/data/cards";

// must be a client component because we can't pass icons from server components to client components
export const RelativeValuesTabs: FC<{
  model: ModelCardDTO;
  variableName: string;
}> = ({ model, variableName }) => {
  return (
    <StyledTabLink.List>
      <StyledTabLink
        name="List"
        icon={Bars4Icon}
        href={modelForRelativeValuesExportRoute({
          owner: model.owner.slug,
          slug: model.slug,
          variableName,
        })}
      />
      <StyledTabLink
        name="Grid"
        icon={TableCellsIcon}
        href={modelForRelativeValuesExportRoute({
          owner: model.owner.slug,
          slug: model.slug,
          variableName,
          mode: "grid",
        })}
      />
      <StyledTabLink
        name="Plot"
        icon={ScatterPlotIcon}
        href={modelForRelativeValuesExportRoute({
          owner: model.owner.slug,
          slug: model.slug,
          variableName,
          mode: "plot",
        })}
      />
    </StyledTabLink.List>
  );
};
