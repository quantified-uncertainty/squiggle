import * as d3 from "d3";
import { useCallback, useState } from "react";
import { DrawContext } from "./useCanvas.js";
import { Point } from "../draw/types.js";

export function useCanvasCursor() {
  const [cursor, setCursor] = useState<Point | undefined>();

  const init = useCallback(({ context }: DrawContext) => {
    d3.select(context.canvas)
      .on("touchmove", (event) => event.preventDefault())
      .on("pointermove", (e) => {
        const pointer = d3.pointer(e);
        setCursor({ x: pointer[0], y: pointer[1] }); // TODO - debounce?
      })
      .on("pointerout", () => {
        setCursor(undefined); // TODO - debounce?
      });
  }, []);

  return {
    cursor,
    initCursor: init,
  };
}
