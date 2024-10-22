"use client";

import { fromByteArray, toByteArray } from "base64-js";
import { useSearchParams } from "next/navigation";
import { deflate, inflate } from "pako";
import { use, useState } from "react";

import {
  defaultSquiggleVersion,
  SquigglePlaygroundVersionPicker,
  type SquiggleVersion,
  squiggleVersions,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

import { useAvailableHeight } from "../../utils/useAvailableHeight";
import { ShareButton } from "./ShareButton";

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

export default function PlaygroundPage() {
  const params = useSearchParams();

  const hashData = getHashData();
  if (hashData.initialSquiggleString) {
    hashData.defaultCode = String(hashData.initialSquiggleString);
    delete hashData.initialSquiggleString;
  }

  // infinite spinner
  const bannedVersions = ["0.9.4", "0.9.5"];
  const defaultUnbannedVersion = bannedVersions.includes(defaultSquiggleVersion)
    ? "dev"
    : defaultSquiggleVersion;

  const [version, setVersion] = useState<SquiggleVersion>(() => {
    // TODO - replace with `useAdjustedSquiggleVersion`
    for (const version of squiggleVersions) {
      if (params.get("v") === version && !bannedVersions.includes(version)) {
        return version;
      }
    }
    if (params.get("v") && typeof window !== "undefined") {
      // wrong version, let's replace it
      updateUrl({}, defaultUnbannedVersion);
    }
    return defaultUnbannedVersion;
  });

  const onVersionChange = (version: SquiggleVersion) => {
    setVersion(version);
    updateUrl({}, version);
  };

  const { height, ref } = useAvailableHeight();

  const squiggle = use(versionedSquigglePackages(version));

  return (
    <div className="bg-white" ref={ref}>
      <squiggle.components.SquigglePlayground
        height={height}
        defaultCode={hashData.defaultCode ?? "a = normal(0, 1)"}
        distributionChartSettings={{
          showSummary: hashData.showSummary ?? true,
        }}
        renderExtraControls={() => (
          <div className="flex h-full items-center justify-end gap-2">
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
}
