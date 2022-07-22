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
    defaultCode: "normal(0,1)",
    height: 700,
    ...hashData,
    onCodeChange: (code) => setHashData({ initialSquiggleString: code }),
    onSettingsChange: (settings) => {
      const { showSummary, showEditor } = settings;
      setHashData({ showSummary, showEditor });
    },
  };
  return (
    <Layout title="Playground" description="Squiggle Playground">
      <div
        style={{
          maxWidth: 2000,
        }}
      >
        <SquigglePlayground {...playgroundProps} />
      </div>
    </Layout>
  );
}
