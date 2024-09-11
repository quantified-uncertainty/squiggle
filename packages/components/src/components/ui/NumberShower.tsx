import * as React from "react";

import {
  DurationUnitName,
  durationUnits,
  makeFormattedNumber,
} from "@quri/squiggle-lang";

//At this point we only support duration units.
export interface NumberShowerProps {
  number: number;
  precision?: number;
  unitName?: DurationUnitName;
}

export const NumberShower: React.FC<NumberShowerProps> = ({
  number,
  precision = 2,
  unitName,
}) => {
  const numberWithPresentation = makeFormattedNumber(number, {
    precision,
  });
  const negativeSign = numberWithPresentation.isNegative ? "-" : "";
  const unitString = unitName && <span> {durationUnits[unitName].plural}</span>;
  switch (numberWithPresentation.type) {
    case "basic":
      return (
        <span>
          {negativeSign}
          {numberWithPresentation.value}
          {unitString}
        </span>
      );
    case "scientific":
      return (
        <span className="whitespace-nowrap">
          {negativeSign}
          {numberWithPresentation.mantissa}{" "}
          <span>
            {"\u00b7" /* dot symbol */}10
            <sup style={{ fontSize: "0.7em" }}>
              {numberWithPresentation.exponent}
            </sup>
          </span>
          {unitString}
        </span>
      );
    case "unit":
      return (
        <span>
          {negativeSign}
          {numberWithPresentation.mantissa}
          {numberWithPresentation.symbol} {unitString}
        </span>
      );
  }
};
