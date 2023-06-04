import { SquiggleEditor as OriginalSquiggleEditor } from "@quri/squiggle-components";
import { TailwindProvider } from "@quri/ui";

export const SquiggleEditor = (props) => (
  <TailwindProvider>
    <OriginalSquiggleEditor {...props} />
  </TailwindProvider>
);
