import { FC } from "react";

import {
  Button,
  CodeBracketIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  WrenchIcon,
} from "@quri/ui";

import {
  SquiggleVersion,
  checkSquiggleVersion,
  squiggleVersions,
} from "../versions";

export const PlaygroundVersionPicker: FC<{
  version: string;
  onChange: (newVersion: SquiggleVersion) => void;
  size: "small" | "medium";
}> = ({ version, onChange, size }) => {
  const versionIsValid = checkSquiggleVersion(version);

  const versionTitle = (version: string) =>
    version === "dev" ? "Dev" : version;

  const versionIcon = (version: string) =>
    version === "dev" ? WrenchIcon : CodeBracketIcon;

  const CurrentIcon = versionIcon(version);

  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          {squiggleVersions.map((version) => (
            <DropdownMenuActionItem
              key={version}
              title={versionTitle(version)}
              icon={versionIcon(version)}
              onClick={() => {
                onChange(version);
                close();
              }}
            />
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLinkItem
            href="https://www.squiggle-language.com/docs/Changelog"
            newTab={true}
            title="Changelog"
            close={close}
          />
        </DropdownMenu>
      )}
    >
      <Button size={size}>
        <div className="flex items-center gap-2">
          <CurrentIcon size={14} className="text-slate-500" />
          {versionTitle(version)}
          {versionIsValid ? "" : ` (unknown)`}
        </div>
      </Button>
    </Dropdown>
  );
};
