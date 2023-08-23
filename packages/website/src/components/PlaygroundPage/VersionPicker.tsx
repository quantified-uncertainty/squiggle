import { FC } from "react";
import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
} from "@quri/ui";
import { Version, versions } from "./versions";

export const VersionPicker: FC<{
  version: Version;
  onChange: (newVersion: Version) => void;
}> = ({ version, onChange }) => {
  return (
    <div className="flex gap-2 items-center">
      <Dropdown
        render={({ close }) => (
          <DropdownMenu>
            {versions.map((version) => (
              <DropdownMenuActionItem
                key={version}
                title={version}
                onClick={() => {
                  onChange(version);
                  close();
                }}
              />
            ))}
          </DropdownMenu>
        )}
      >
        <Button size="small">{version}</Button>
      </Dropdown>
    </div>
  );
};
