import { ErrorValue } from "@quri/squiggle-lang";
import React from "react";
import { ErrorAlert } from "./Alert";

type Props = {
  error: ErrorValue;
};

export const SquiggleErrorAlert: React.FC<Props> = ({ error }) => {
  return <ErrorAlert heading="Error">{error.toString()}</ErrorAlert>;
};
