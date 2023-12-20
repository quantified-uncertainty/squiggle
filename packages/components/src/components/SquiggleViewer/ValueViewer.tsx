import React from "react";

import { SqValue } from "@quri/squiggle-lang";

import { valueHasContext } from "../../lib/utility.js";
import { MessageAlert } from "../Alert.js";
import { ValueWithContextViewer } from "./ValueWithContextViewer.js";

type Props = {
  value: SqValue;
  parentValue?: SqValue;
};

export const ValueViewer: React.FC<Props> = ({ value, parentValue }) => {
  if (!valueHasContext(value)) {
    return <MessageAlert heading="Can't display pathless value" />;
  }

  return <ValueWithContextViewer value={value} parentValue={parentValue} />;
};
