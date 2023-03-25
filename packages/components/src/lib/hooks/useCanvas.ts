import { useRef } from "react";
import { usePrevious } from "react-use";

export function useCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  const devicePixelRatio = window.devicePixelRatio || 1;

  const previous = usePrevious(ref.current);
  const refChanged = previous !== ref.current && ref.current;

  if (refChanged) {
    // the DOM node was either just initialized or has changed
    const canvas = ref.current;

    canvas.style.width = `${canvas.clientWidth}px`;
    canvas.style.height = `${canvas.clientHeight}px`;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
  }

  const context = ref.current?.getContext("2d");
  context?.resetTransform();
  context?.scale(devicePixelRatio, devicePixelRatio);

  return { ref, refChanged, context };
}
