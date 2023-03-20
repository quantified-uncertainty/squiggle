import React, { Fragment, PropsWithChildren } from "react";
import { Tab } from "@headlessui/react";
import clsx from "clsx";

// copied from squiggle-components

type StyledTabProps = {
  name: string;
  icon?: (props: React.ComponentProps<"svg">) => JSX.Element;
};

type StyledTabType = React.FC<StyledTabProps> & {
  List: React.FC<PropsWithChildren>;
  Group: typeof Tab.Group;
  Panels: typeof Tab.Panels;
  Panel: typeof Tab.Panel;
};

export const StyledTab: StyledTabType = ({ name, icon: Icon }) => {
  return (
    <Tab as={Fragment}>
      {({ selected }) => (
        <button className="group flex rounded-md focus:outline-none focus-visible:ring-offset-gray-100">
          <span
            className={clsx(
              "p-1 pl-2.5 pr-3.5 rounded-md flex items-center text-sm font-medium",
              selected && "bg-white shadow-sm ring-1 ring-black ring-opacity-5"
            )}
          >
            {Icon && (
              <Icon
                className={clsx(
                  "-ml-0.5 mr-2 h-4 w-4",
                  selected
                    ? "text-slate-500"
                    : "text-gray-400 group-hover:text-gray-900"
                )}
              />
            )}
            <span
              className={clsx(
                selected
                  ? "text-gray-900"
                  : "text-gray-600 group-hover:text-gray-900"
              )}
            >
              {name}
            </span>
          </span>
        </button>
      )}
    </Tab>
  );
};

StyledTab.List = function StyledTabList({ children }) {
  return (
    <Tab.List className="flex w-fit p-0.5 rounded-md bg-slate-100 hover:bg-slate-200">
      {children}
    </Tab.List>
  );
};

StyledTab.Group = Tab.Group;
StyledTab.Panels = Tab.Panels;
StyledTab.Panel = Tab.Panel;
