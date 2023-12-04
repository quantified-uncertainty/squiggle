import type { Meta } from "@storybook/react";
import { FnDocumentation } from "../components/ui/FnDocumentation.js";

import {
  getAllFunctionNames,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

/**
 * Internal UI component. Used in `SquigglePlayground`.
 */
const meta = { component: FnDocumentation } satisfies Meta<
  typeof FnDocumentation
>;
export default meta;

export const FnStory = () => {
  const fnNames = getAllFunctionNames();
  const fnDocumentation = fnNames.map(getFunctionDocumentation);

  return (
    <div>
      {fnDocumentation.map((e, i) =>
        e ? (
          <div className="pb-2" key={i}>
            <FnDocumentation documentation={e} />
          </div>
        ) : (
          ""
        )
      )}
    </div>
  );
};

FnStory.story = {
  name: "All",
};
