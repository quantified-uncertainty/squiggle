import { clsx } from "clsx";
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
    editor?.scrollTo(location.start.offset, true);
  };

  return (
    <span
      className={clsx(editor && "cursor-pointer hover:underline text-blue-500")}
      onClick={editor ? findInEditor : undefined}
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
    <div className="text-sm font-medium mb-1 text-gray-700">{header}</div>
    <div className="ml-1">{children}</div>
  </div>
);

const StackTraceFrame: FC<{ frame: SqFrame }> = ({ frame }) => {
  const location = frame.location();
  const name = frame.name();
  return (
    <>
      <div className="text-gray-500 font-mono font-medium truncate">{name}</div>
      <div>{location && <LocationLine location={location} />}</div>
    </>
  );
};

const StackTrace: FC<{ error: SqRuntimeError }> = ({ error }) => {
  const frames = error.getFrameArray();
  return frames.length ? (
    <WithHeader header="Stack Trace">
      <div className="grid grid-cols-[minmax(60px,max-content),1fr] gap-x-4">
        {frames.map((frame, i) => (
          <StackTraceFrame frame={frame} key={i} />
        ))}
      </div>
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
