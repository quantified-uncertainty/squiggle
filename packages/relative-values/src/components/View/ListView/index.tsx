import { useDashboardContext } from "@/components/Dashboard/DashboardProvider";
import { SqLambda, SqProject } from "@quri/squiggle-lang";
import { FC, Fragment, useState } from "react";
import { RelativeCell } from "../RelativeCell";
import { Header } from "../Header";
import { CellBox } from "../CellBox";
import { useCachedPairsToOneItem } from "../hooks";
import { Dropdown } from "@/components/ui/Dropdown";
import { Choice } from "@/types";

const ColumnHeaderContextMenu: FC<{
  setSelectedItem(choice: Choice): void;
}> = ({ setSelectedItem }) => {
  const {
    catalog: { items },
  } = useDashboardContext();

  const [search, setSearch] = useState("");

  return (
    <div className="w-96">
      <input
        type="text"
        className="p-1 rounded border border-gray-200 w-full mb-4"
        defaultValue={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      <div className="overflow-auto max-h-96">
        <div className="flex flex-col gap-1">
          {items
            .filter((item) => item.name.match(new RegExp(search, "i")))
            .map((item) => (
              <div
                className="hover:bg-gray-100 rounded p-1 cursor-pointer text-xs"
                onClick={() => setSelectedItem(item)}
              >
                {item.name}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const ColumnHeader: FC<{
  selectedItem: Choice;
  setSelectedItem(choice: Choice): void;
}> = ({ selectedItem, setSelectedItem }) => {
  return (
    <Dropdown
      render={({ close }) => (
        <ColumnHeaderContextMenu
          setSelectedItem={(item) => {
            setSelectedItem(item);
            close();
          }}
        />
      )}
    >
      <Header choice={selectedItem} clickable />
    </Dropdown>
  );
};

type Props = {
  fn: SqLambda;
  project: SqProject;
};

export const ListView: FC<Props> = ({ fn, project }) => {
  const {
    catalog: { items },
  } = useDashboardContext();

  const [selectedItem, setSelectedItem] = useState(items[0]);

  const cachedPairs = useCachedPairsToOneItem(fn, items, selectedItem.id);

  return (
    <div>
      <div
        className="grid grid-cols-3 border-r border-b border-gray-200 w-max"
        style={{
          gridTemplateColumns:
            "minmax(100px, min-content) 180px minmax(100px, min-content)",
        }}
      >
        <div className="sticky bg-white top-0 left-0 z-20" />
        <ColumnHeader
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
        <CellBox header>
          <div className="p-1">ID</div>
        </CellBox>
        {items.map((item) => (
          <Fragment key={item.id}>
            <Header choice={item} />
            <RelativeCell
              id1={item.id}
              id2={selectedItem.id}
              cache={cachedPairs}
              project={project}
            />
            <CellBox>
              <div className="p-1 font-mono text-xs">{item.id}</div>
            </CellBox>
          </Fragment>
        ))}
      </div>
    </div>
  );
};
