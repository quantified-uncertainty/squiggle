import { fromByteArray, toByteArray } from "base64-js";
import { deflate, inflate } from "pako";
import { FC, useState } from "react";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
} from "@quri/ui";

import { ShareButton } from "./ShareButton";
import {
  Version,
  VersionedPlayground,
  defaultVersion,
  versions,
} from "./VersionedPlayground";

const HASH_PREFIX = "#code=";
function getHashData() {
  if (typeof window === "undefined") {
    return {};
  }
  const hash = window.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) {
    return {};
  }
  try {
    const compressed = toByteArray(
      decodeURIComponent(hash.slice(HASH_PREFIX.length))
    );
    const text = inflate(compressed, { to: "string" });
    return JSON.parse(text);
  } catch (err) {
    console.error(err);
    return {};
  }
}

type Data = {
  initialSquiggleCode?: string; // legacy
  defaultCode?: string;
  showSummary?: boolean;
};

function updateUrl(data: Partial<Data>, version: Version) {
  const text = JSON.stringify({ ...getHashData(), ...data });
  const compressed = deflate(text, { level: 9 });
  window.history.replaceState(
    undefined,
    "",
    `/playground?v=${version}` +
      HASH_PREFIX +
      encodeURIComponent(fromByteArray(compressed))
  );
}

const VersionPicker: FC<{
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

export const PlaygroundPage: FC<{ version: string | null }> = (props) => {
  const hashData = getHashData();
  if (hashData.initialSquiggleString) {
    hashData.defaultCode = String(hashData.initialSquiggleString);
    delete hashData.initialSquiggleString;
  }

  const [version, setVersion] = useState<Version>(() => {
    for (const version of versions) {
      if (props.version === version) {
        return version;
      }
    }
    if (props.version && typeof window !== "undefined") {
      // wrong version, let's replace it
      updateUrl({}, defaultVersion);
    }
    return defaultVersion;
  });

  const onVersionChange = (version: Version) => {
    setVersion(version);
    updateUrl({}, version);
  };

  return (
    <VersionedPlayground
      version={version}
      defaultCode={hashData.defaultCode ?? "normal(0, 1)"}
      distributionChartSettings={{
        showSummary: hashData.showSummary ?? true,
      }}
      renderExtraControls={() => (
        <div className="h-full flex justify-end items-center gap-2">
          <ShareButton />
          <VersionPicker version={version} onChange={onVersionChange} />
        </div>
      )}
      onCodeChange={(code) => updateUrl({ defaultCode: code }, version)}
      onSettingsChange={(settings) => {
        const showSummary = settings.distributionChartSettings?.showSummary;
        updateUrl({ showSummary }, version);
      }}
    />
  );
};
