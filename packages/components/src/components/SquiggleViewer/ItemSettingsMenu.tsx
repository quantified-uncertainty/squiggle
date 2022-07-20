import React from "react";
import { DropdownMenu } from "../ui/DropdownMenu";
import { LocalItemSettings } from "./utils";

type Props = {
  settings: LocalItemSettings;
  setSettings: (value: LocalItemSettings) => void;
};

export const ItemSettingsMenu: React.FC<Props> = ({
  settings,
  setSettings,
}) => {
  return (
    <div className="flex gap-1 items-center">
      <DropdownMenu>
        <DropdownMenu.CheckboxItem
          label="Log X scale"
          value={settings.distributionPlotSettings?.logX ?? false}
          toggle={() =>
            setSettings({
              ...settings,
              distributionPlotSettings: {
                ...settings.distributionPlotSettings,
                logX: !settings.distributionPlotSettings?.logX,
              },
            })
          }
        />
        <DropdownMenu.CheckboxItem
          label="Exp Y scale"
          value={settings.distributionPlotSettings?.expY ?? false}
          toggle={() =>
            setSettings({
              ...settings,
              distributionPlotSettings: {
                ...settings.distributionPlotSettings,
                expY: !settings.distributionPlotSettings?.expY,
              },
            })
          }
        />
        <DropdownMenu.CheckboxItem
          label="Show summary"
          value={settings.distributionPlotSettings?.showSummary ?? false}
          toggle={() =>
            setSettings({
              ...settings,
              distributionPlotSettings: {
                ...settings.distributionPlotSettings,
                showSummary: !settings.distributionPlotSettings?.showSummary,
              },
            })
          }
        />
      </DropdownMenu>
      {settings.distributionPlotSettings || settings.chartSettings ? (
        <button
          onClick={() =>
            setSettings({
              ...settings,
              distributionPlotSettings: undefined,
              chartSettings: undefined,
            })
          }
          className="text-xs px-1 py-0.5 rounded bg-slate-300"
        >
          Reset settings
        </button>
      ) : null}
    </div>
  );
};
