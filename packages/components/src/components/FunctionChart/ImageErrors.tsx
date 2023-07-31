import { FC } from "react";
import groupBy from "lodash/groupBy.js";

import { ImageError } from "./utils.js";
import { ErrorAlert } from "../Alert.js";
import { NumberShower } from "../NumberShower.js";

type GroupedImageErrors = {
  [k: string]: {
    x: number;
    value: string;
  }[];
};

export const ImageErrors: FC<{ errors: ImageError[] }> = ({ errors }) => {
  const entries = Object.entries(errors);
  if (!entries.length) {
    return null;
  }

  const groupedErrors: GroupedImageErrors = groupBy(errors, (x) => x.value);

  return (
    <div className="space-y-1">
      {Object.entries(groupedErrors).map(([errorName, errorPoints]) => (
        <ErrorAlert key={errorName} heading={errorName}>
          Values:{" "}
          {errorPoints
            .map((r, i) => <NumberShower key={i} number={r.x} />)
            .reduce((a, b) => (
              <>
                {a}, {b}
              </>
            ))}
        </ErrorAlert>
      ))}
    </div>
  );
};
