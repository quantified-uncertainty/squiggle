import BrowserOnly from "@docusaurus/BrowserOnly";
import { FallbackSpinner } from "./FallbackSpinner";

export function SquigglePlayground(props) {
  return (
    <BrowserOnly fallback={<FallbackSpinner height="100vh" />}>
      {() => {
        const LibComponent =
          require("@quri/squiggle-components").SquigglePlayground;
        return <LibComponent {...props} />;
      }}
    </BrowserOnly>
  );
}
