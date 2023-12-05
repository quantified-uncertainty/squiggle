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
    <span
      className="cursor-pointer hover:underline text-blue-500"
      onClick={findInEditor}
    >
      line {location.start.line}, column {location.start.column}
    </span>
  );
};

const WithHeader: FC<PropsWithChildren<{ header: string }>> = ({
  header,
  children,
}) => (
  <div>
    <div className="text-sm font-medium mb-1 text-stone-700">{header}</div>
    <div className="ml-1">{children}</div>
  </div>
);

const StackTraceFrame: FC<{ frame: SqFrame }> = ({ frame }) => {
  const location = frame.location();
  const name = frame.name();
  return (
    <div className="grid grid-cols-[1fr_5fr] gap-x-2 items-center">
      <div className="text-stone-500 font-mono font-semibold truncate">
        {name !== "" ? name : <span className="text-transparent">-</span>}
      </div>
      {location ? (
        <LocationLine location={location} />
      ) : (
        <span className="text-transparent">-</span>
      )}
    </div>
  );
};

const StackTrace: FC<{ error: SqRuntimeError }> = ({ error }) => {
  const frames = error.getFrameArray();
  return frames.length ? (
    <WithHeader header="Stack Trace">
      {frames.map((frame, i) => (
        <StackTraceFrame frame={frame} key={i} />
      ))}
    </WithHeader>
  ) : null;
};

export const SquiggleErrorAlert: FC<Props> = ({ error }) => {
  function errorName(): string {
    if (error instanceof SqCompileError) {
      return "Compile Error";
    } else if (error instanceof SqRuntimeError) {
      return "Runtime Error";
    } else {
      return "Error";
    }
  }
  return (
    <ErrorAlert heading={errorName()}>
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
