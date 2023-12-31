"use client";
import { FC } from "react";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuHeader,
  DropdownMenuLinkItem,
  DropdownMenuModalActionItem,
  DropdownMenuSeparator,
  HelpIcon,
  Modal,
} from "@quri/ui";

import {
  SquiggleVersionShower,
  versionIcon,
  versionTitle,
} from "./SquiggleVersionShower.js";
import { SquiggleVersion, squiggleVersions } from "./versions.js";

const CHANGELOG_URL = "https://www.squiggle-language.com/docs/Changelog";

export const SquigglePlaygroundVersionPicker: FC<{
  version: string;
  onChange: (newVersion: SquiggleVersion) => void;
  // This is mostly Squiggle Hub specific, but we might later decide to do auto-updates in Squiggle Playground too.
  showUpdatePolicy?: boolean;
  // "medium" was intended for "New Model" form in Squiggle Hub, but it's currently unused
  size: "small" | "medium";
}> = ({ version, onChange, showUpdatePolicy, size }) => {
  return (
    <div className="flex">
      <Dropdown
        render={({ close }) => (
          <DropdownMenu>
            <DropdownMenuHeader>Squiggle Version</DropdownMenuHeader>
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
            {showUpdatePolicy ? (
              <DropdownMenuModalActionItem
                title="Version Update Policy"
                icon={HelpIcon}
                render={() => (
                  <Modal close={close}>
                    <Modal.Header>
                      <div className="flex items-center gap-2">
                        <HelpIcon className="text-slate-500" />
                        Version Update Policy
                      </div>
                    </Modal.Header>
                    <Modal.Body>
                      {/* Markdown here would be nice, but we don't have it available in @quri/ui. */}
                      <div className="space-y-2">
                        <p>
                          We’ll auto-update your model to the most recent
                          non-breaking version of Squiggle.
                        </p>
                        <p>
                          However, if you use the{" "}
                          <span className="font-semibold">Next</span> version,
                          it will always stay on the Beta - so only do this if
                          you’re okay fixing it if it breaks, or temporarily if
                          you need to use a feature that’s not been released
                          yet.
                        </p>
                      </div>
                    </Modal.Body>
                  </Modal>
                )}
              />
            ) : null}
            <DropdownMenuLinkItem
              href={CHANGELOG_URL}
              newTab={true}
              title="Changelog"
              close={close}
            />
          </DropdownMenu>
        )}
      >
        <Button size={size}>
          <SquiggleVersionShower version={version} />
        </Button>
      </Dropdown>
    </div>
  );
};
