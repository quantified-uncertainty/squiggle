import { fromByteArray, toByteArray } from "base64-js";
import { deflate, inflate } from "pako";
import { FC, useEffect, useState } from "react";

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

export const PlaygroundPage: FC<{ version: string | null }> = (props) => {
  const hashData = getHashData();
  if (hashData.initialSquiggleString) {
    hashData.defaultCode = String(hashData.initialSquiggleString);
    delete hashData.initialSquiggleString;
  }

  const [version, setVersion] = useState<SquiggleVersion>(() => {
    // TODO - replace with `useAdjustedSquiggleVersion`
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

  /**
   * I couldn't call `use()` here, probably because Nextra doesn't support `app/` yet, and Next.js with `pages/` uses an older React version.
   * Next.js fails with this error: "TypeError: (0 , react__WEBPACK_IMPORTED_MODULE_3__.use) is not a function"
   * Waiting for React 19 to clean this up...
   */
  const [squiggle, setSquiggle] = useState<
    undefined | Awaited<ReturnType<typeof versionedSquigglePackages>>
  >();
  useEffect(() => {
    versionedSquigglePackages(version)
      .then((squiggle) => setSquiggle(squiggle))
      .catch(() => setSquiggle(undefined)); // TODO - show an error?

    return () => setSquiggle(undefined);
  }, [version]);

  return (
    <div
      className="min-h-[calc(100vh-var(--nextra-navbar-height)-200px)]"
      ref={ref}
    >
      {
        squiggle ? (
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
                  version={version}
                  onChange={onVersionChange}
                />
              </div>
            )}
            onCodeChange={(code) => updateUrl({ defaultCode: code }, version)}
            onSettingsChange={(settings) => {
              const showSummary =
                settings.distributionChartSettings?.showSummary;
              updateUrl({ showSummary }, version);
            }}
          />
        ) : null // TODO - show a loading indicator?
      }
    </div>
  );
};
