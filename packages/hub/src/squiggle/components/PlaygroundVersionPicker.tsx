import { FC } from "react";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
} from "@quri/ui";

import {
  SquiggleVersion,
  checkSquiggleVersion,
  squiggleVersions,
} from "../versions";
import { DropdownMenuLinkItem } from "@/components/ui/DropdownMenuLinkItem";

export const PlaygroundVersionPicker: FC<{
  version: string;
  onChange: (newVersion: SquiggleVersion) => void;
  size?: "small" | "medium";
}> = ({ version, onChange, size }) => {
  const versionIsValid = checkSquiggleVersion(version);

  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          {squiggleVersions.map((version) => (
            <DropdownMenuActionItem
              key={version}
              title={version === "dev" ? "Dev" : version}
              onClick={() => {
                onChange(version);
                close();
              }}
            />
          ))}
          <DropdownMenuLinkItem
            href="https://www.squiggle-language.com/docs/Changelog"
            title="Changelog"
            close={close}
          />
        </DropdownMenu>
      )}
    >
      <Button size={size}>
        {versionIsValid ? version : `${version} (unknown)`}
      </Button>
    </Dropdown>
  );
};
