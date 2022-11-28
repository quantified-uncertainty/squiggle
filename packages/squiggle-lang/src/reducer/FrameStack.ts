// This is called "frameStack" and not "callStack", because the last frame in errors is often not a function call.
// A "frame" is a pair of a scope (function or top-level scope, currently stored as a string) and a location inside it.
// See this comment to deconfuse about what a frame is: https://github.com/quantified-uncertainty/squiggle/pull/1172#issuecomment-1264115038

import { LocationRange } from "peggy";

export const topFrameName = "<top>";

export type Frame = {
  name: string;
  location: LocationRange | undefined; // can be empty for calls from builtin functions
};

export type FrameStack =
  | {
      frame: Frame;
      parent: FrameStack;
    }
  | {
      frame: undefined; // empty top
    };

export const frameToString = ({ name, location }: Frame) =>
  name +
  (location
    ? ` at line ${location.start.line}, column ${location.start.column}, file ${location.source}`
    : "");

export const make = (): FrameStack => ({ frame: undefined });

// TODO - immutable.js?
export const extend = (
  t: FrameStack,
  name: string,
  location: LocationRange | undefined
): FrameStack => ({
  frame: {
    name,
    location,
  },
  parent: t,
});

// this is useful for SyntaxErrors
export const makeSingleFrameStack = (location: LocationRange): FrameStack =>
  extend(make(), topFrameName, location);

// this includes the left offset because it's mostly used in SqError.toStringWithStackTrace
export const toString = (t: FrameStack): string => {
  return toFrameArray(t)
    .map((f) => "  " + frameToString(f))
    .join("\n");
};

export const toFrameArray = (t: FrameStack): Frame[] => {
  const result: Frame[] = [];
  while (t.frame) {
    result.push(t.frame);
    t = t.parent;
  }
  return result;
};

export const getTopFrame = (t: FrameStack): Frame | undefined => t.frame;

export const isEmpty = (t: FrameStack): boolean => t.frame === undefined;
