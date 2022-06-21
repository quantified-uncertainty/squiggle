import { deflate, inflate } from "pako";
import { toByteArray, fromByteArray } from "base64-js";
import React from "react";
import Layout from "@theme/Layout";
import { SquigglePlayground } from "../components/SquigglePlayground";

function getHashData() {
  if (typeof window === "undefined" || !window.location.hash) {
    return {};
  }
  try {
    const compressed = toByteArray(
      decodeURIComponent(window.location.hash.slice(1))
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
  window.location.hash = encodeURIComponent(fromByteArray(compressed));
}

export default function PlaygroundPage() {
  const playgroundProps = {
    initialSquiggleString: "normal(0,1)",
    height: 700,
    showTypes: true,
    ...getHashData(),
    onCodeChange: (code) => setHashData({ initialSquiggleString: code }),
    onSettingsChange: (settings) => {
      const { showTypes, showControls, showSummary, showEditor } = settings;
      setHashData({ showTypes, showControls, showSummary, showEditor });
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
