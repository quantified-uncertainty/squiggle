import { SqError, SqFrame } from "@quri/squiggle-lang";
import React from "react";
import { ErrorAlert } from "./Alert";

type Props = {
  error: SqError;
};

const StackTraceFrame: React.FC<{ frame: SqFrame }> = ({ frame }) => {
  const location = frame.location();
  return (
    <div>
      {frame.name()}
      {location
        ? ` at line ${location.start.line}, column ${location.start.column}`
        : ""}
    </div>
  );
};

const StackTrace: React.FC<Props> = ({ error }) => {
  const frames = error.getFrameArray();
  return frames.length ? (
    <div>
      <div className="font-medium">Stack trace:</div>
      <div className="ml-4">
        {frames.map((frame, i) => (
          <StackTraceFrame frame={frame} key={i} />
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
