import { DotsVerticalIcon } from "@heroicons/react/solid/esm";
import { drag, pointer } from "d3";
import React, {
  MouseEventHandler,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const c: React.FC<{ children: ReactElement[] }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  if (React.Children.count(children) !== 2) throw "Children count should be 2";

  const [cw, setWidth] = useState<number | null>(null);
  const [ch, setHeight] = useState<number | null>(null);

  const start = useRef<[number, number] | null>(null);
  const left = children[0];
  const right = children[1];

  const refRoot = useRef<HTMLDivElement>(null);
  const refLeft = useRef<HTMLDivElement>(null);
  const refRight = useRef<HTMLDivElement>(null);

  /*eslint no-console: "off"*/
  const mouseDown: MouseEventHandler = (mouseEv) => {
    if (!refLeft.current) return;
    start.current = [mouseEv.clientX, mouseEv.clientY];
    // mouseEv.
    console.log("mouse down!");
  };
  const mouseUp = (_mouseEv: MouseEvent) => {
    if (!start.current) return;
    start.current = null;
    console.log("up!");
  };

  const mouseMove = (mouseEv: MouseEvent) => {
    console.log(start.current, cw, ch);
    if (!start.current) return;
    // if (!ch) return;
    // const [ax, ay] = start.current;
    // const bx = mouseEv.clientX;
    // const by = mouseEv.clientY;

    // console.log("move!", mouseEv.clientX, mouseEv.clientY);

    // STOPSHIP: Add initial dividier position offset!
    setWidth(mouseEv.clientX);
    // setHeight(mouseEv.clientY);

    // updateSize([mouseEv.offsetX, mouseEv.offsetY]);
  };

  useEffect(() => {
    if (refLeft.current && (!cw || !ch)) {
      console.log("Init size");
      setWidth(refLeft.current.clientWidth);
      setHeight(refLeft.current.clientHeight);
    }
  });

  useEffect(() => {
    if (ref.current && refLeft.current && refRight.current) {
      console.log(ref.current.parentNode as HTMLDivElement);
      console.log(refLeft.current);
      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);

      return () => {
        document.removeEventListener("mousemove", mouseMove);
        document.removeEventListener("mouseup", mouseUp);
      };
    }
  }, [ref]);

  useEffect(() => {
    console.log("Size change!", cw, ch);
  }, [cw, ch]);

  return (
    <div className="flex flex-col md:flex-row" ref={refRoot}>
      <div
        ref={refLeft}
        style={cw ? { width: `${cw}px`, minWidth: 300, minHeight: 300 } : {}}
      >
        {/* <div className="bg-pink-100 h-full">
        ...
        </div> */}
        {left}
      </div>
      <div
        className="
          transition
          hover:bg-blue-100
          md:w-0.5 md:h-auto
          md:cursor-ew-resize
          w-auto h-1
          cursor-ns-resize
          bg-blue-50
          select-none"
        ref={ref}
        onMouseDown={mouseDown}
      ></div>
      <div className="grow" ref={refRight}>
        {right}
      </div>
    </div>
  );
};

export default c;
