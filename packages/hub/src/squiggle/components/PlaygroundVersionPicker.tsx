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
}> = ({ version, onChange }) => {
  const versionIsValid = checkSquiggleVersion(version);

  return (
    <div className="flex gap-2 items-center">
      <Dropdown
        render={({ close }) => (
          <DropdownMenu>
            {squiggleVersions.map((version) => (
              <DropdownMenuActionItem
                key={version}
                title={version}
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
        <Button size="small">
          {versionIsValid ? version : `${version} (unknown)`}
        </Button>
      </Dropdown>
    </div>
  );
};
