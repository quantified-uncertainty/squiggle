import { FC } from "react";

import { SqErrorList } from "@quri/squiggle-lang";

import { SquiggleErrorAlert } from "./SquiggleErrorAlert.js";

export const SquiggleErrorListAlert: FC<{ errorList: SqErrorList }> = ({
  errorList,
}) => {
  const errors = errorList.errors;
  if (errors.length === 1) {
    return <SquiggleErrorAlert error={errors[0]} />;
  }
  return (
    <div>
      {errors.map((error, index) => (
        <div key={index}>
          <SquiggleErrorAlert error={error} />
        </div>
      ))}
    </div>
  );
};
