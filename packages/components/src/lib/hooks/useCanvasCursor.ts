import * as d3 from "d3";
import { useRef } from "react";
import { useUpdate } from "react-use";

export function useCanvasCursor({
  refChanged,
  context,
}: {
  refChanged: boolean;
  context: CanvasRenderingContext2D | null | undefined;
}) {
  const update = useUpdate();
  const cursorRef = useRef<[number, number]>();

  if (refChanged && context) {
    d3.select(context.canvas)
      .on("touchmove", (event) => event.preventDefault())
      .on("pointermove", (e) => {
        cursorRef.current = d3.pointer(e);
        update(); // TODO - debounce?
      })
      .on("pointerout", (e) => {
        cursorRef.current = undefined;
        update();
      });
  }

  return cursorRef.current;
}
