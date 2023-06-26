import { FC, PropsWithChildren } from "react";

import {
  SqCompileError,
  SqError,
  SqFrame,
  SqRuntimeError,
} from "@quri/squiggle-lang";

import { ErrorAlert } from "./Alert.js";
import { useViewerContext } from "./SquiggleViewer/ViewerProvider.js";

type Props = {
  error: SqError;
};

const LocationLine: FC<{
  location: NonNullable<ReturnType<SqFrame["location"]>>;
}> = ({ location }) => {
  const { editor } = useViewerContext();

  const findInEditor = () => {
    editor?.scrollTo(location.start.offset);
  };

  return (
    <span className="cursor-pointer hover:text-red-900" onClick={findInEditor}>
      at line {location.start.line}, column {location.start.column}
    </span>
  );
};

const WithHeader: FC<PropsWithChildren<{ header: string }>> = ({
  header,
  children,
}) => (
  <div>
    <div className="font-medium">{header}</div>
    <div className="ml-4">{children}</div>
  </div>
);

const StackTraceFrame: FC<{ frame: SqFrame }> = ({ frame }) => {
  const location = frame.location();
  return (
    <div>
      {frame.name()} {location ? <LocationLine location={location} /> : ""}
    </div>
  );
};

const StackTrace: FC<{ error: SqRuntimeError }> = ({ error }) => {
  const frames = error.getFrameArray();
  return frames.length ? (
    <WithHeader header="Stack trace:">
      {frames.map((frame, i) => (
        <StackTraceFrame frame={frame} key={i} />
      ))}
    </WithHeader>
  ) : null;
};

export const SquiggleErrorAlert: FC<Props> = ({ error }) => {
  return (
    <ErrorAlert heading="Error">
      <div className="space-y-4">
        <div className="whitespace-pre-wrap">{error.toString()}</div>
        {error instanceof SqRuntimeError ? (
          <StackTrace error={error} />
        ) : error instanceof SqCompileError ? (
          <WithHeader header="Location:">
            <LocationLine location={error.location()} />
          </WithHeader>
        ) : null}
      </div>
    </ErrorAlert>
  );
};
