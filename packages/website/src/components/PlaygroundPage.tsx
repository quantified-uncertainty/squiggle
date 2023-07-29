import { fromByteArray, toByteArray } from "base64-js";
import { deflate, inflate } from "pako";
import React, { FC } from "react";

import { SquigglePlayground } from "@quri/squiggle-components";

import { ShareButton } from "./ShareButton";
import { useAvailableHeight } from "../utils/useAvailableHeight";

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

function setHashData(data) {
  const text = JSON.stringify({ ...getHashData(), ...data });
  const compressed = deflate(text, { level: 9 });
  window.history.replaceState(
    undefined,
    "",
    HASH_PREFIX + encodeURIComponent(fromByteArray(compressed))
  );
}

export const PlaygroundPage: FC = () => {
  const hashData = getHashData();
  if (hashData.initialSquiggleString) {
    hashData.defaultCode = String(hashData.initialSquiggleString);
    delete hashData.initialSquiggleString;
  }
  const { height, ref } = useAvailableHeight();

  return (
    <div
      className="min-h-[calc(100vh-var(--nextra-navbar-height)-200px)]"
      ref={ref}
    >
      <SquigglePlayground
        defaultCode={hashData.defaultCode ?? "normal(0, 1)"}
        distributionChartSettings={{
          showSummary: hashData.showSummary ?? true,
        }}
        height={height}
        renderExtraControls={() => (
          <div className="h-full flex justify-end items-center">
            <ShareButton />
          </div>
        )}
        onCodeChange={(code) => setHashData({ defaultCode: code })}
        onSettingsChange={(settings) => {
          const showSummary = settings.distributionChartSettings?.showSummary;
          setHashData({ showSummary });
        }}
      />
    </div>
  );
};
