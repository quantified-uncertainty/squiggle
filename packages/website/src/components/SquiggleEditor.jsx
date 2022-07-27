import BrowserOnly from "@docusaurus/BrowserOnly";
import { FallbackSpinner } from "./FallbackSpinner";

export function SquiggleEditor(props) {
  return (
    <BrowserOnly fallback={<FallbackSpinner height={292} />}>
      {() => {
        const LibComponent =
          require("@quri/squiggle-components").SquiggleEditor;
        return <LibComponent {...props} />;
      }}
    </BrowserOnly>
  );
}

export function SquiggleEditorImportedBindings(props) {
  return (
    <BrowserOnly fallback={<FallbackSpinner height={292} />}>
      {() => {
        const LibComponent =
          require("@quri/squiggle-components").SquiggleEditorImportedBindings;
        return <LibComponent {...props} />;
      }}
    </BrowserOnly>
  );
}
