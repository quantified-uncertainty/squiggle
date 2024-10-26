"use client";
import { FC, PropsWithChildren } from "react";

import {
  SqCompileError,
  SqError,
  SqFrame,
  SqImportError,
  SqLocation,
  SqRuntimeError,
} from "@quri/squiggle-lang";

import { useViewerContext } from "../SquiggleViewer/ViewerProvider.js";
import { ErrorAlert } from "./Alert.js";

type Props = {
  error: SqError;
};

const LocationLine: FC<{ location: SqLocation }> = ({ location }) => {
  const { externalViewerActions } = useViewerContext();

  const text =
    `line ${location.start.line}, column ${location.start.column}` +
    (externalViewerActions?.isDefaultSourceId?.(location.source)
      ? ""
      : `, file ${location.source}`);

  return externalViewerActions.show &&
    externalViewerActions.isFocusable?.(location) ? (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        externalViewerActions.show?.(location, true);
      }}
      className="text-blue-500 hover:underline"
    >
      {text}
    </a>
  ) : (
    <span>{text}</span>
  );
};

const WithHeader: FC<PropsWithChildren<{ header: string }>> = ({
  header,
  children,
}) => (
  <div>
    <div className="mb-1 text-sm font-medium text-gray-700">{header}</div>
    <div className="ml-1">{children}</div>
  </div>
);

const StackTraceFrame: FC<{ frame: SqFrame }> = ({ frame }) => {
  const location = frame.location();
  const name = frame.name();
  return (
    <>
      <div className="truncate font-mono font-medium text-gray-500">{name}</div>
      <div>{location && <LocationLine location={location} />}</div>
    </>
  );
};

const ImportChainFrame: FC<{ frame: SqFrame }> = ({ frame }) => {
  const location = frame.location();
  const name = frame.name();
  return (
    <>
      <div className="font-mono">
        import{" "}
        <span className="truncate font-medium text-gray-500">{name}</span>
      </div>
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

const ImportChain: FC<{ error: SqImportError }> = ({ error }) => {
  const frames = error.getFrameArray();
  return frames.length ? (
    <WithHeader header="Import Chain:">
      <div className="grid grid-cols-[minmax(60px,max-content),1fr] gap-x-4">
        {frames.map((frame, i) => (
          <ImportChainFrame frame={frame} key={i} />
        ))}
      </div>
    </WithHeader>
  ) : null;
};

function errorName(error: SqError): string {
  if (error instanceof SqImportError) {
    return errorName(error.wrappedError());
  }

  if (error instanceof SqCompileError) {
    return "Compile Error";
  } else if (error instanceof SqRuntimeError) {
    return "Runtime Error";
  } else {
    return "Error";
  }
}

const SquiggleErrorAlertBody: FC<{
  error: Exclude<SqError, { tag: "import" }>;
}> = ({ error }) => {
  return (
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
  );
};

export const SquiggleErrorAlert: FC<Props> = ({ error }) => {
  return (
    <ErrorAlert heading={errorName(error)}>
      {error instanceof SqImportError ? (
        <div className="space-y-4">
          <SquiggleErrorAlertBody error={error.wrappedError()} />
          <ImportChain error={error} />
        </div>
      ) : (
        <SquiggleErrorAlertBody error={error} />
      )}
    </ErrorAlert>
  );
};
