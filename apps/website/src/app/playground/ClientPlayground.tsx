"use client";

import { useSearchParams } from "next/navigation";
import { FC, use, useEffect, useState } from "react";

import {
  checkSquiggleVersion,
  defaultSquiggleVersion,
  getPlaygroundUrl,
  parsePlaygroundUrl,
  type PlaygroundParams,
  SquigglePlaygroundVersionPicker,
  type SquiggleVersion,
  squiggleVersions,
  versionedSquigglePackages,
} from "@quri/versioned-squiggle-components";

import { useAvailableHeight } from "../../utils/useAvailableHeight";
import { ShareButton } from "./ShareButton";

function updateUrl(params: Partial<PlaygroundParams>) {
  const url = new URL(window.location.href);
  const newUrl = getPlaygroundUrl({ ...parsePlaygroundUrl(url), ...params });

  // Easier than removing the origin prefix, but is it reliable?
  newUrl.host = url.host;
  newUrl.protocol = url.protocol;

  // Intentionally not triggering Next.js navigation / re-render.
  window.history.replaceState(undefined, "", newUrl.toString());
}

export const ClientPlayground: FC = () => {
  const params = useSearchParams();

  useEffect(() => {
    // normalize the URL once
    updateUrl({});
  }, []);

  const [initialParams] = useState<PlaygroundParams>(() => {
    if (typeof window === "undefined") {
      const v = params.get("v");
      if (v && checkSquiggleVersion(v)) {
        return { version: v };
      } else {
        return {};
      }
    }
    const url = new URL(window.location.href);
    return parsePlaygroundUrl(url);
  });

  // infinite spinner
  const bannedVersions = ["0.9.4", "0.9.5"];
  const defaultUnbannedVersion = bannedVersions.includes(defaultSquiggleVersion)
    ? "dev"
    : defaultSquiggleVersion;

  const [version, setVersion] = useState<SquiggleVersion>(() => {
    // TODO - replace with `useAdjustedSquiggleVersion`
    for (const version of squiggleVersions) {
      if (
        initialParams.version === version &&
        !bannedVersions.includes(version)
      ) {
        return version;
      }
    }
    if (initialParams.version && typeof window !== "undefined") {
      // wrong version, let's replace it
      updateUrl({ version: defaultUnbannedVersion });
    }
    return defaultUnbannedVersion;
  });

  const onVersionChange = (version: SquiggleVersion) => {
    setVersion(version);
    updateUrl({ version });
  };

  const { height, ref } = useAvailableHeight();

  const squiggle = use(versionedSquigglePackages(version));

  return (
    <div className="bg-white" ref={ref}>
      <squiggle.components.SquigglePlayground
        height={height}
        defaultCode={initialParams.code ?? "a = normal(0, 1)"}
        distributionChartSettings={{
          showSummary: initialParams.showSummary ?? true,
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
        onCodeChange={(code) => updateUrl({ code })}
        onSettingsChange={(settings) => {
          const showSummary = settings.distributionChartSettings?.showSummary;
          updateUrl({ showSummary });
        }}
      />
    </div>
  );
};
