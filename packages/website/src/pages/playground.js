import { deflate, inflate } from "pako";
import { toByteArray, fromByteArray } from "base64-js";
import React from "react";
import Layout from "@theme/Layout";
import { SquigglePlayground } from "../components/SquigglePlayground";

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

export default function PlaygroundPage() {
  const hashData = getHashData();
  if (hashData.initialSquiggleString) {
    hashData.defaultCode = String(hashData.initialSquiggleString);
    delete hashData.initialSquiggleString;
  }
  const playgroundProps = {
    defaultCode: hashData.defaultCode ?? "normal(0,1)",
    distributionChartSettings: {
      showSummary: hashData.showSummary ?? true,
    },
    height: 700,
    showShareButton: true,
    showEditor: hashData.showEditor ?? true,
    onCodeChange: (code) => setHashData({ defaultCode: code }),
    onSettingsChange: (settings) => {
      const { showEditor } = settings;
      const showSummary = settings.distributionChartSettings?.showSummary;
      setHashData({ showSummary, showEditor });
    },
  };
  return (
    <Layout title="Playground" description="Squiggle Playground">
      <div
        style={{
          maxWidth: 2000,
          padding: 8,
        }}
      >
        <SquigglePlayground {...playgroundProps} />
      </div>
    </Layout>
  );
}
