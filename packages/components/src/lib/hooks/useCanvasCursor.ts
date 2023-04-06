import * as d3 from "d3";
import { useCallback, useState } from "react";
import { DrawContext } from "./useCanvas.js";

export function useCanvasCursor() {
  const [cursor, setCursor] = useState<[number, number] | undefined>();

  const init = useCallback(({ context }: DrawContext) => {
    d3.select(context.canvas)
      .on("touchmove", (event) => event.preventDefault())
      .on("pointermove", (e) => {
        setCursor(d3.pointer(e)); // TODO - debounce?
      })
      .on("pointerout", (e) => {
        setCursor(undefined); // TODO - debounce?
      });
  }, []);

  return {
    cursor,
    initCursor: init,
  };
}
