import React from "react";
import Layout from "@theme/Layout";
import { SquigglePlayground } from "../components/SquigglePlayground";

export default function PlaygroundPage() {
  return (
    <Layout title="Playground" description="Squiggle Playground">
      <div
        style={{
          maxWidth: 2000,
        }}
      >
        <SquigglePlayground
          initialSquiggleString="normal(0,1)"
          height={700}
          showTypes={true}
        />
      </div>
    </Layout>
  );
}
