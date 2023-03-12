import { useDashboardContext } from "@/components/Dashboard/DashboardProvider";
import { SqLambda, SqProject } from "@quri/squiggle-lang";
import { FC, Fragment, useState } from "react";
import { RelativeCell } from "../RelativeCell";
import { Header } from "../Header";
import { CellBox } from "../CellBox";
import { useCachedPairsToOneItem } from "../hooks";

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
        <Header choice={selectedItem} />
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
