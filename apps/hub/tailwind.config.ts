import { getTailwindConfig } from "@quri/versioned-squiggle-components/tailwind";

const config = getTailwindConfig({
  content: ["./src/**/*.{ts,tsx}"],
});

if (!Array.isArray(config.content)) {
  throw new Error("Expected an array of content globs");
}

export default {
  ...config,
  content: [
    ...config.content,
    // relative values views; not covered by versioned components globs
    "../../packages/relative-values/src/**/*.{ts,tsx}",
  ],
};
