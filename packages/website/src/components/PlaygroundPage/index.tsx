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
import { Version, VersionedPlayground, versions } from "./VersionedPlayground";

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

function setHashData(data: Partial<Data>) {
  const text = JSON.stringify({ ...getHashData(), ...data });
  const compressed = deflate(text, { level: 9 });
  window.history.replaceState(
    undefined,
    "",
    HASH_PREFIX + encodeURIComponent(fromByteArray(compressed))
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

export const PlaygroundPage: FC = () => {
  const hashData = getHashData();
  if (hashData.initialSquiggleString) {
    hashData.defaultCode = String(hashData.initialSquiggleString);
    delete hashData.initialSquiggleString;
  }

  const [version, setVersion] = useState<Version>("latest");

  return (
    <VersionedPlayground
      version={version}
      defaultCode={hashData.defaultCode ?? "normal(0, 1)"}
      distributionChartSettings={{
        showSummary: hashData.showSummary ?? true,
      }}
      renderExtraControls={() => (
        <div className="h-full flex justify-end items-center">
          <ShareButton />
          <VersionPicker version={version} onChange={setVersion} />
        </div>
      )}
      onCodeChange={(code) => setHashData({ defaultCode: code })}
      onSettingsChange={(settings) => {
        const showSummary = settings.distributionChartSettings?.showSummary;
        setHashData({ showSummary });
      }}
    />
  );
};
