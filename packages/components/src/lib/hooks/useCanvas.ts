import isEqual from "lodash/isEqual.js";
import { useRef } from "react";
import { usePrevious } from "./react-use.js";

export function useCanvas({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  const devicePixelRatio = window.devicePixelRatio || 1;

  const props = {
    canvas: ref.current,
    width,
    height,
  };
  const previous = usePrevious(props);
  const refChanged = !isEqual(previous, props) && !!ref.current;

  if (refChanged) {
    // the DOM node was either just initialized or has changed
    const canvas = ref.current;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
  }

  if (!ref.current) {
    return {
      ref,
      refChanged: false,
      context: undefined,
    };
  }

  const context = ref.current.getContext("2d") ?? undefined; // avoid "null" for simplicity
  context?.resetTransform();
  context?.scale(devicePixelRatio, devicePixelRatio);

  return {
    ref,
    refChanged,
    context,
  };
}
