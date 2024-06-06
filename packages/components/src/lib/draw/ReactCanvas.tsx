import {
  cloneElement,
  createContext,
  FC,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Node } from "yoga-layout";

import { DrawFunction } from "../hooks/useCanvas.js";
import { CanvasLayout, makeNode } from "./CanvasElement.js";

function useWidth() {
  // We throttle to get around a Firefox bug.
  // See: https://github.com/quantified-uncertainty/squiggle/issues/2263
  const RESIZE_DELAY = 30;

  const [width, setWidth] = useState<number | undefined>();

  const throttleTimeout = useRef<number | null>(null);

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (!entries[0]) return;

    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }

    throttleTimeout.current = window.setTimeout(() => {
      setWidth(entries[0].contentRect.width);
    }, RESIZE_DELAY);
  }, []);

  const observer = useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return new window.ResizeObserver(handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current);
      }
      observer?.disconnect();
    };
  }, []);

  const setElement = useCallback((element: HTMLElement) => {
    observer?.disconnect();
    observer?.observe(element);
  }, []);

  return { width, setInitialWidth: setWidth, setElement };
}

export function useReactCanvas({
  rootNode,
  init,
}: {
  // TODO - support `initialHeight` to miminize the reflows
  rootNode: Node;
  init?: DrawFunction; // useful for cursor initializations, see useCanvasCursor()
}) {
  const { width, setInitialWidth, setElement: setWidthElement } = useWidth();
  const [context, setContext] = useState<
    CanvasRenderingContext2D | undefined
  >();

  // Initialized height and calls Yoga layout
  const height = useMemo(() => {
    if (width === undefined) {
      return undefined;
    }
    rootNode.calculateLayout(width, undefined);
    return rootNode.getComputedHeight();
  }, [width, rootNode]);

  // TODO - move outside of useReactCanvas? it's weird that rootNode is passed from outside but destroyed by this hook
  useEffect(() => {
    // Yoga doesn't have garbage collection; https://www.yogalayout.dev/docs/getting-started/laying-out-a-tree#building-a-yoga-tree
    return () => rootNode.freeRecursive();
  }, [rootNode]);

  const devicePixelRatio =
    typeof window === "undefined" ? 1 : window.devicePixelRatio;

  const ref = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!canvas) {
        return;
      }
      const usedWidth = canvas.getBoundingClientRect().width;
      setInitialWidth(usedWidth);

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Failed to initialize 2d context"); // shouldn't happen, all browsers support 2d context
      }
      context.resetTransform();
      context.scale(devicePixelRatio, devicePixelRatio);

      setContext(context);
      init?.({
        context,
        width: usedWidth,
        height: canvas.height / devicePixelRatio,
      });
      // TODO - call `draw` too? would be slightly faster; but we can't put `draw` in callback dependencies

      setWidthElement(canvas);
    },
    [setWidthElement, setInitialWidth, devicePixelRatio, init]
  );

  useLayoutEffect(() => {
    if (width === undefined || context === undefined) {
      return;
    }
    // We have to do this here and not on observer's callback, because otherwise there's a delay between
    // width change and drawing (setWidth is not synchronous), and that causes flickering and other issues.
    const { canvas } = context;
    canvas.width = width * devicePixelRatio;
  }, [context, width, devicePixelRatio]);

  useLayoutEffect(() => {
    if (height === undefined || context === undefined) {
      return;
    }

    const { canvas } = context;
    canvas.style.height = `${height}px`;
    canvas.height = height * devicePixelRatio;
  }, [context, devicePixelRatio, height]);

  // happens on each render
  useEffect(() => {
    return () => {
      if (!context) return;
      // context.reset() would be better, but it's still unsupported in older Safari versions
      context.resetTransform();
      context.scale(devicePixelRatio, devicePixelRatio);
      context.clearRect(
        0,
        0,
        context.canvas.width / devicePixelRatio,
        context.canvas.height / devicePixelRatio
      );
    };
  });

  return {
    ref,
    width,
    context,
  };
}

type NodeElement = ReactElement; // TODO - limit to canvas components only

function addYogaNodeProp(element: NodeElement) {
  return cloneElement(element, {
    ...element.props,
    node: element.props.node ?? makeNode(),
  });
}

const CanvasContext = createContext<{ context?: CanvasRenderingContext2D }>({});

export const CanvasNode: FC<{
  node?: Node;
  draw(context: CanvasRenderingContext2D, layout: CanvasLayout): void;
}> = ({ node, draw }) => {
  const { context } = useContext(CanvasContext);
  useEffect(() => {
    if (!node || !context) return;
    // note that we don't take `right` and `bottom`; they seem broken in current yoga-layout (always zero)
    const { width, height, left, top } = node.getComputedLayout();

    context.save();
    context.translate(left, top);

    draw(context, { width, height, left, top });

    context.restore();
  });

  return null;
};

export const ReactCanvas: FC<{
  children: NodeElement[];
  alt?: string;
}> = ({ children, alt }) => {
  const patchedChildren = useMemo(
    () => children.map((child) => addYogaNodeProp(child)),
    [children]
  );

  // Build root node
  const rootNode = useMemo(() => {
    const rootNode = makeNode();
    for (const child of patchedChildren) {
      rootNode.insertChild(child.props.node, rootNode.getChildCount());
    }
    return rootNode;
  }, [patchedChildren]);

  const { ref, context } = useReactCanvas({
    rootNode,
    // init: opts?.init,
  });

  return (
    <CanvasContext.Provider value={{ context }}>
      <canvas className="w-full" ref={ref}>
        {alt}
        {patchedChildren}
      </canvas>
    </CanvasContext.Provider>
  );
};

// Example

const CanvasRow: FC<{ node?: Node, children: NodeElement[] }> = ({ node, children }) => {
  if (!node) {
    return null;
  }

  useLayoutEffect(() => {
    for (const child of children) {

    }

  }, [node, children]);
  return (


  );

};

const Example1: FC<{ node?: Node; color: string }> = ({ node, color }) => {
  node?.setHeight(100);
  return (
    <CanvasNode
      node={node}
      draw={(context, layout) => {
        context.fillStyle = color;
        context.fillRect(0, 0, layout.width / 2, layout.height);
      }}
    />
  );
};

export const CanvasExample: FC = () => (
  <ReactCanvas>
    <Example1 color="red" />
    <Example1 color="green" />
  </ReactCanvas>
);

const Example1: FC<{ node?: Node; color: string }> = ({ node, color }) => {
  node?.setHeight(100);
  return (
    <CanvasNode
      node={node}
      draw={(context, layout) => {
        context.fillStyle = color;
        context.fillRect(0, 0, layout.width / 2, layout.height);
      }}
    />
  );
};
