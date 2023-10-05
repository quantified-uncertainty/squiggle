import { fromByteArray, toByteArray } from "base64-js";
import { deflate, inflate } from "pako";
import { FC, useState } from "react";

import { ShareButton } from "./ShareButton";
import {
  VersionedSquigglePlayground,
  SquigglePlaygroundVersionPicker,
  defaultSquiggleVersion,
  type SquiggleVersion,
  squiggleVersions,
} from "@quri/versioned-playground";
import { useAvailableHeight } from "../../utils/useAvailableHeight";

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

function updateUrl(data: Partial<Data>, version: SquiggleVersion) {
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

export const PlaygroundPage: FC<{ version: string | null }> = (props) => {
  const hashData = getHashData();
  if (hashData.initialSquiggleString) {
    hashData.defaultCode = String(hashData.initialSquiggleString);
    delete hashData.initialSquiggleString;
  }

  const [version, setVersion] = useState<SquiggleVersion>(() => {
    for (const version of squiggleVersions) {
      if (props.version === version) {
        return version;
      }
    }
    if (props.version && typeof window !== "undefined") {
      // wrong version, let's replace it
      updateUrl({}, defaultSquiggleVersion);
    }
    return defaultSquiggleVersion;
  });

  const onVersionChange = (version: SquiggleVersion) => {
    setVersion(version);
    updateUrl({}, version);
  };

  const { height, ref } = useAvailableHeight();

  return (
    <div
      className="min-h-[calc(100vh-var(--nextra-navbar-height)-200px)]"
      ref={ref}
    >
      <VersionedSquigglePlayground
        version={version}
        height={height}
        defaultCode={hashData.defaultCode ?? "normal(0, 1)"}
        distributionChartSettings={{
          showSummary: hashData.showSummary ?? true,
        }}
        renderExtraControls={() => (
          <div className="h-full flex justify-end items-center gap-2">
            <ShareButton />
            <SquigglePlaygroundVersionPicker
              size="small"
              version={version}
              onChange={onVersionChange}
            />
          </div>
        )}
        onCodeChange={(code) => updateUrl({ defaultCode: code }, version)}
        onSettingsChange={(settings) => {
          const showSummary = settings.distributionChartSettings?.showSummary;
          updateUrl({ showSummary }, version);
        }}
      />
    </div>
  );
};
