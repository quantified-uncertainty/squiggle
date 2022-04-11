import React from "react";
import Layout from "@theme/Layout";
import { SquigglePlayground } from "../components/SquigglePlayground";

export default function PlaygroundPage() {
  return (
    <Layout title="Playground" description="Squiggle Playground">
      <div
        style={{
          maxWidth: 2000,
          paddingTop: "3em",
          margin: "0 auto",
        }}
      >
        <h2> Squiggle Playground </h2>
        <SquigglePlayground initialSquiggleString="normal(0,1)" />
      </div>
    </Layout>
  );
}
