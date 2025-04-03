import { Tooltip } from "@quri/ui";

type Item = {
  name: string;
  color: string;
};

const LegendItem: React.FC<{ item: Item; onHighlight: () => void }> = ({
  item,
  onHighlight,
}) => {
  return (
    <Tooltip
      render={() => (
        <div className="rounded border border-gray-300 bg-white p-2 text-xs">
          {item.name}
        </div>
      )}
    >
      <div>
        <div
          className="flex cursor-pointer items-center"
          onMouseOver={() => onHighlight()}
        >
          <svg className="mt-1 shrink-0" height="10" width="16">
            <circle cx="4" cy="4" r="4" fill={item.color} />
          </svg>
          <div className="sm:max-w-160 text-xs sm:overflow-hidden sm:text-ellipsis sm:whitespace-nowrap sm:text-sm">
            {item.name}
          </div>
        </div>
      </div>
    </Tooltip>
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
