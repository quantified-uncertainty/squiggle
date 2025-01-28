import { useRef, useState } from "react";

import { shift, useFloating } from "@floating-ui/react-dom";

type Item = {
  name: string;
  color: string;
};

const LegendItem: React.FC<{ item: Item; onHighlight: () => void }> = ({
  item,
  onHighlight,
}) => {
  const { x, y, reference, floating, strategy } = useFloating({
    middleware: [shift()],
  });

  const [showTooltip, setShowTooltip] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const onHover = () => {
    if (
      textRef.current &&
      textRef.current.scrollWidth > textRef.current.clientWidth
    ) {
      setShowTooltip(true);
    }
    onHighlight();
  };

  return (
    <>
      <div
        className="flex items-center cursor-pointer"
        onMouseOver={onHover}
        onMouseLeave={() => setShowTooltip(false)}
        ref={reference}
      >
        <svg className="mt-1 shrink-0" height="10" width="16">
          <circle cx="4" cy="4" r="4" fill={item.color} />
        </svg>
        <div
          className="text-xs sm:text-sm sm:whitespace-nowrap sm:text-ellipsis sm:overflow-hidden sm:max-w-160"
          ref={textRef}
        >
          {item.name}
        </div>
      </div>
      {showTooltip
        ? (() => {
            return (
              <div
                className={`absolute text-xs p-2 border border-gray-300 rounded bg-white ${
                  showTooltip ? "" : "hidden"
                }`}
                ref={floating}
                style={{
                  position: strategy,
                  top: y ?? "",
                  left: x ?? "",
                }}
              >
                {item.name}
              </div>
            );
          })()
        : null}
    </>
  );
};

export const Legend: React.FC<{
  items: { name: string; color: string }[];
  setHighlight: (i: number | undefined) => void;
}> = ({ items, setHighlight }) => {
  return (
    <div className="space-y-2" onMouseLeave={() => setHighlight(undefined)}>
      {items.map((item, i) => (
        <LegendItem
          key={item.name}
          item={item}
          onHighlight={() => setHighlight(i)}
        />
      ))}
    </div>
  );
};
