import { useCallback, useEffect, useMemo, useState } from "react";

export type DrawContext = {
  context: CanvasRenderingContext2D;
  width: number;
};

type DrawFunction = (context: DrawContext) => void;

export function useCanvas({
  height,
  init,
  draw,
}: {
  height: number;
  init?: DrawFunction; // e.g. for cursor initializations, see useCanvasCursor()
  draw: DrawFunction;
}) {
  const [width, setWidth] = useState<number | undefined>();
  const [context, setContext] = useState<
    CanvasRenderingContext2D | undefined
  >();

  const devicePixelRatio = window.devicePixelRatio || 1;

  const updateSize = useCallback(
    (canvas: HTMLCanvasElement, width: number) => {
      // note: width shouldn't be set here, otherwise observer won't work
      canvas.style.height = `${height}px`;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      setWidth(width);
    },
    [devicePixelRatio, height]
  );

  const observer = useMemo(
    () =>
      new window.ResizeObserver((entries) => {
        if (!entries[0]) {
          return;
        }
        updateSize(
          entries[0].target as HTMLCanvasElement,
          entries[0].contentRect.width
        );
      }),
    [updateSize]
  );

  useEffect(() => {
    return () => {
      observer.disconnect();
    };
  }, [observer]);

  const ref = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!canvas) {
        return;
      }
      const usedWidth = canvas.getBoundingClientRect().width;
      updateSize(canvas, usedWidth);

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Failed to initialize 2d context"); // shouldn't happen, all browsers support 2d context
      }
      context.resetTransform();
      context.scale(devicePixelRatio, devicePixelRatio);

      setContext(context);
      init?.({ context, width: usedWidth });
      // TODO - call `draw` too? would be slightly faster

      observer.disconnect();
      observer.observe(canvas);
    },
    [init, observer, updateSize, devicePixelRatio]
  );

  const redraw = useCallback(() => {
    if (width === undefined || context === undefined) {
      return;
    }
    context.resetTransform();
    context.scale(devicePixelRatio, devicePixelRatio);
    draw({ width, context });
  }, [draw, width, context, devicePixelRatio]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  return {
    ref,
    redraw,
    width,
  };
}
