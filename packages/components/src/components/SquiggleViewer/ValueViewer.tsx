import React, { ReactNode } from "react";

import { SqValue } from "@quri/squiggle-lang";

import { valueHasContext } from "../../lib/utility.js";
import { MessageAlert } from "../Alert.js";
import { VariableBox } from "./VariableBox.js";
import { MergedItemSettings, getChildrenValues } from "./utils.js";
import { getBoxProps } from "./getBoxProps.js";

// We use an extra left margin for some elements to align them with parent variable name
export const leftMargin = "ml-1.5";

export const truncateStr = (str: string, maxLength: number) =>
  str.substring(0, maxLength) + (str.length > maxLength ? "..." : "");

// Distributions should be smaller than the other charts.
// Note that for distributions, this only applies to the internals, there's also extra margin and details.
export const CHART_TO_DIST_HEIGHT_ADJUSTMENT = 0.5;

type Props = {
  /** The output of squiggle's run */
  value: SqValue;
  width?: number;
};

export const ValueViewer: React.FC<Props> = ({ value }) => {
  if (!valueHasContext(value)) {
    return <MessageAlert heading="Can't display pathless value" />;
  }

  const boxProps = getBoxProps(value);
  const heading = boxProps.heading || value.publicName();
  const hasChildren = () => !!getChildrenValues(value);
  const children: (settings: MergedItemSettings) => ReactNode =
    (value.tag === "Dict" || value.tag === "Array") && hasChildren()
      ? (settings) => (
          <div className="space-y-2 pt-1 mt-1">
            {boxProps.children(settings)}
          </div>
        )
      : boxProps.children;
  return (
    <VariableBox {...boxProps} value={value} heading={heading}>
      {children}
    </VariableBox>
  );
};
