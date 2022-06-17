import { errorValue, errorValueToString } from "@quri/squiggle-lang";
import React from "react";
import { ErrorAlert } from "./Alert";

type Props = {
  error: errorValue;
};

export const SquiggleErrorAlert: React.FC<Props> = ({ error }) => {
  return <ErrorAlert heading="Error">{errorValueToString(error)}</ErrorAlert>;
};
