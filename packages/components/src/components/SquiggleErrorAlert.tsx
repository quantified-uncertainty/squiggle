import { SqError, SqLocation } from "@quri/squiggle-lang";
import React from "react";
import { ErrorAlert } from "./Alert";

type Props = {
  error: SqError;
};

const StackTraceLocation: React.FC<{ location: SqLocation }> = ({
  location,
}) => {
  return (
    <div>
      Line {location.start.line}, column {location.start.column}
    </div>
  );
};

const StackTrace: React.FC<Props> = ({ error }) => {
  return (
    <div>
      {error.toLocationArray().map((location, i) => (
        <StackTraceLocation location={location} key={i} />
      ))}
    </div>
  );
};

export const SquiggleErrorAlert: React.FC<Props> = ({ error }) => {
  return (
    <ErrorAlert heading="Error">
      <div>{error.toString()}</div>
      <div className="mt-4">Traceback:</div>
      <div className="ml-4">
        <StackTrace error={error} />
      </div>
    </ErrorAlert>
  );
};
