import { select as d3Select, pointer as d3Pointer } from "d3-selection";
import { useRef } from "react";
import useUpdate from "react-use/lib/useUpdate";

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
    d3Select(context.canvas)
      .on("touchmove", (event) => event.preventDefault())
      .on("pointermove", (e) => {
        cursorRef.current = d3Pointer(e);
        update(); // TODO - debounce?
      })
      .on("pointerout", (e) => {
        cursorRef.current = undefined;
        update();
      });
  }

  return cursorRef.current;
}
