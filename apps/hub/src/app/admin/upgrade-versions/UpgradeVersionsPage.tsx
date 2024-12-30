"use client";
import clsx from "clsx";
import { FC, useEffect, useState } from "react";

import {
  Button,
  CheckIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  LockIcon,
  RefreshIcon,
  XIcon,
} from "@quri/ui";
import {
  checkSquiggleVersion,
  defaultSquiggleVersion,
} from "@quri/versioned-squiggle-components";
import { compareVersions } from "@quri/versioned-squiggle-components/compareVersions";

import { H2 } from "@/components/ui/Headers";
import { SafeActionButton } from "@/components/ui/SafeActionButton";
import { StyledLink } from "@/components/ui/StyledLink";
import { adminUpdateModelVersionAction } from "@/models/actions/adminUpdateModelVersionAction";
import { ModelByVersion } from "@/models/data/byVersion";

const ComparedCode: FC<{
  modelId: string;
  version: string;
  code: string;
}> = ({ modelId, version, code }) => {
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "upgraded"
  >("loading");

  useEffect(() => {
    if (!checkSquiggleVersion(version)) {
      setStatus("error");
      return;
    }

    compareVersions({
      version1: version,
      version2: defaultSquiggleVersion,
      code: code,
    }).then((result) => {
      if (result) {
        setStatus("error");
      } else {
        setStatus("success");
      }
    });
  }, [version, code]);

  const commonClasses = "w-6 h-6";
  switch (status) {
    case "loading":
      return (
        <RefreshIcon
          className={clsx(commonClasses, "animate-spin text-gray-400")}
        />
      );
    case "success":
      return (
        <div className="flex gap-1">
          <CheckIcon className={clsx(commonClasses, "text-green-500")} />
          <SafeActionButton
            action={adminUpdateModelVersionAction}
            input={{
              modelId: modelId,
              version: defaultSquiggleVersion,
            }}
            onSuccess={() => setStatus("upgraded")}
            theme="primary"
            size="small"
          >
            Upgrade to {defaultSquiggleVersion}
          </SafeActionButton>
        </div>
      );
    case "upgraded":
      return <CheckIcon className={clsx(commonClasses, "text-green-500")} />;

    case "error":
      return <XIcon className={clsx(commonClasses, "text-red-500")} />;
  }
};

const ComparedModel: FC<{
  model: ModelByVersion["models"][number];
}> = ({ model }) => {
  const squiggleSnippet = model.currentRevision?.squiggleSnippet;

  if (!squiggleSnippet) {
    return null;
  }

  const version = squiggleSnippet.version;

  return (
    <div className="col-span-2 grid grid-cols-subgrid gap-2">
      <div className="flex items-center gap-1">
        <StyledLink
          href={`/admin/upgrade-versions/compare?owner=${model.owner.slug}&slug=${model.slug}`}
        >
          {model.owner.slug}/{model.slug}
        </StyledLink>
        {model.isPrivate ? (
          <LockIcon className="h-4 w-4 text-gray-600" />
        ) : null}
      </div>
      <ComparedCode
        modelId={model.id}
        version={version}
        code={squiggleSnippet.code}
      />
    </div>
  );
};

const ModelList: FC<{
  models: ModelByVersion["models"];
}> = ({ models }) => {
  const limitStep = 10;
  const [limit, setLimit] = useState(limitStep);

  if (!models.length) return null;

  return (
    <div>
      <p className="pb-4 text-xs">
        {`In the list below, you'll see the green checkmark if the model's output is identical to the output of the new version. If not, you'll see a red X, but you can go to the model's "compare" page to see the difference and upgrade it manually.`}
      </p>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(2, max-content)" }}
      >
        {models.slice(0, limit).map((model) => (
          <ComparedModel model={model} key={model.id} />
        ))}
      </div>
      {models.length > limit ? (
        <Button onClick={() => setLimit((limit) => limit + limitStep)}>
          Show more
        </Button>
      ) : null}
    </div>
  );
};

export const UpgradeVersionsPage: FC<{
  modelsByVersion: ModelByVersion[];
}> = ({ modelsByVersion }) => {
  type Entry = (typeof modelsByVersion)[number];

  const upgradeableModelsByVersion = modelsByVersion.filter(
    (entry) =>
      entry.version !== "dev" && entry.version !== defaultSquiggleVersion
  );

  const [selectedVersion, setSelectedVersion] = useState(
    upgradeableModelsByVersion.at(0)?.version
  );

  const getEntryTitle = (entry: Entry) => `${entry.version} (${entry.count})`;

  const getEntryByVersion = (version: string): Entry | undefined =>
    modelsByVersion.find((entry) => entry.version === version);

  const selectedEntry = selectedVersion
    ? getEntryByVersion(selectedVersion)
    : undefined;

  const devCount = getEntryByVersion("dev")?.models.length ?? 0;
  const latestCount =
    getEntryByVersion(defaultSquiggleVersion)?.models.length ?? 0;

  return (
    <div className="container mx-auto">
      <H2>Upgrade model versions</H2>
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
      {selectedEntry ? (
        <div className="mt-4">
          <ModelList models={selectedEntry.models} />
        </div>
      ) : null}
    </div>
  );
};
