import { getTailwindConfig } from "@quri/versioned-squiggle-components/tailwind";

export default getTailwindConfig({
  content: ["./src/webview/**/*.{ts,tsx}"],
});
