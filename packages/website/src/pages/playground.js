import React from "react";
import Layout from "@theme/Layout";
import { SquigglePlayground } from "../components/SquigglePlayground";

function getHashData() {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    return JSON.parse(window.decodeURIComponent(window.location.hash.slice(1)));
  } catch (err) {
    console.error(err);
    return {};
  }
}

function setHashData(Data) {
  window.location.hash = window.encodeURIComponent(
    JSON.stringify({ ...getHashData(), ...Data })
  );
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
