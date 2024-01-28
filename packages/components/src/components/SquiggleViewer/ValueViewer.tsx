import React from "react";

import { SqValue } from "@quri/squiggle-lang";

import { valueHasContext } from "../../lib/utility.js";
import { MessageAlert } from "../Alert.js";
import { ValueWithContextViewer } from "./ValueWithContextViewer.js";

// Same props as in `ValueWithContextViewer`, but no guarantee that value has context.
type Props = Omit<Parameters<typeof ValueWithContextViewer>[0], "value"> & {
  value: SqValue;
};

export const ValueViewer: React.FC<Props> = ({ value, ...rest }) => {
  if (!valueHasContext(value)) {
    return <MessageAlert heading="Can't display pathless value" />;
  }

  // This key is important, so that scrollEditorToPath() will work correctly when zoomed in.
  return (
    <ValueWithContextViewer
      value={value}
      key={value.context.path.uid()}
      {...rest}
    />
  );
};
