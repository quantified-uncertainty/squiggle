"use client";
import { FC, useState } from "react";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
} from "@quri/ui";
import { defaultSquiggleVersion } from "@quri/versioned-squiggle-components";

import { H2 } from "@/components/ui/Headers";
import { ServerActionButton } from "@/components/ui/ServerActionButton";
import { StyledLink } from "@/components/ui/StyledLink";
import { modelRoute } from "@/routes";
import { adminUpdateModelVersionAction } from "@/server/models/actions/adminUpdateModelVersionAction";
import { ModelByVersion } from "@/server/models/data/byVersion";

import { UpgradeableModel } from "./UpgradeableModel";

const ModelList: FC<{
  models: ModelByVersion["models"];
}> = ({ models }) => {
  const [pos, setPos] = useState(0);

  if (!models.length) return null;
  const usedPos = Math.min(pos, models.length - 1);
  const model = models[usedPos];

  return (
    <div>
      <div className="flex items-center gap-2">
        <div>
          Model:{" "}
          <StyledLink
            href={modelRoute({
              owner: model.owner.slug,
              slug: model.slug,
            })}
          >
            {model.owner.slug}/{model.slug}
          </StyledLink>
        </div>
        <ServerActionButton
          action={async () => {
            await adminUpdateModelVersionAction({
              modelId: model.id,
              version: defaultSquiggleVersion,
            });
            window.location.reload();
          }}
          title={`Upgrade to ${defaultSquiggleVersion}`}
          theme="primary"
        />
        <Button onClick={() => setPos(usedPos - 1)} disabled={usedPos <= 0}>
          &larr; Prev
        </Button>
        <Button
          onClick={() => setPos(usedPos + 1)}
          disabled={usedPos >= models.length - 1}
        >
          Next &rarr;
        </Button>
      </div>
      <UpgradeableModel model={model} />
    </div>
  );
};

export const UpgradeVersionsPage: FC<{
  modelsByVersion: ModelByVersion[];
}> = ({ modelsByVersion }) => {
  type Entry = (typeof modelsByVersion)[number];

  const upgradeableModelsByVersion = modelsByVersion.filter(
    (entry) =>
      entry.version !== "dev" &&
      entry.version !== defaultSquiggleVersion &&
      entry.count > 0
  );

  const [selectedVersion, setSelectedVersion] = useState(
    upgradeableModelsByVersion.at(0)?.version
  );

  const getEntryTitle = (entry: Entry) =>
    `${entry.version} (${entry.count} models, ${entry.privateCount} private)`;

  const getEntryByVersion = (version: string): Entry | undefined =>
    modelsByVersion.find((entry) => entry.version === version);

  const selectedEntry = selectedVersion
    ? getEntryByVersion(selectedVersion)
    : undefined;

  const devCount = getEntryByVersion("dev")?.models.length ?? 0;
  const latestCount =
    getEntryByVersion(defaultSquiggleVersion)?.models.length ?? 0;

  return (
    <div>
      <H2>Upgrade model versions</H2>
      <div>
        <p className="text-xs">
          Check models with their current version and the new version, then
          press the upgrade button if everything is ok.
        </p>
        <p className="text-xs">
          <strong>
            {`Code edits won't be saved, "Upgrade" button bumps only the model's version.`}
          </strong>
        </p>
      </div>
      <div className="mt-2 text-sm">
        <div>Dev models: {devCount}</div>
        <div>
          {defaultSquiggleVersion} models: {latestCount}
        </div>
      </div>
      <div className="flex py-4">
        <Dropdown
          render={({ close }) => (
            <DropdownMenu>
              {upgradeableModelsByVersion.map((entry) => {
                return (
                  <DropdownMenuActionItem
                    key={entry.version}
                    title={getEntryTitle(entry)}
                    onClick={() => {
                      setSelectedVersion(entry.version);
                      close();
                    }}
                  />
                );
              })}
            </DropdownMenu>
          )}
        >
          <Button theme="primary">
            {selectedEntry ? getEntryTitle(selectedEntry) : "Pick a version"}
          </Button>
        </Dropdown>
      </div>
      {selectedEntry ? <ModelList models={selectedEntry.models} /> : null}
    </div>
  );
};
