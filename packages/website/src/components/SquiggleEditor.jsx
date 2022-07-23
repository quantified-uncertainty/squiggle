import BrowserOnly from "@docusaurus/BrowserOnly";
import { FallbackSpinner } from "./FallbackSpinner";

export function SquiggleEditor(props) {
  return (
    <BrowserOnly fallback={<FallbackSpinner height={280} />}>
      {() => {
        const LibComponent =
          require("@quri/squiggle-components").SquiggleEditor;
        return <LibComponent {...props} />;
      }}
    </BrowserOnly>
  );
}
