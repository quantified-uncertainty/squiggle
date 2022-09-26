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
  const locations = error.toLocationArray();
  return locations.length ? (
    <div>
      <div>Traceback:</div>
      <div className="ml-4">
        {locations.map((location, i) => (
          <StackTraceLocation location={location} key={i} />
        ))}
      </div>
    </div>
  ) : null;
};

export const SquiggleErrorAlert: React.FC<Props> = ({ error }) => {
  return (
    <ErrorAlert heading="Error">
      <div className="space-y-4">
        <div>{error.toString()}</div>
        <StackTrace error={error} />
      </div>
    </ErrorAlert>
  );
};
