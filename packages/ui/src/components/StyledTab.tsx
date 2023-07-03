import { FC, Fragment, ReactNode } from "react";
import { Tab } from "@headlessui/react";
import { clsx } from "clsx";
import { IconProps } from "../index.js";

type StyledTabProps = {
  name: string;
  icon?: FC<IconProps>;
};

type StyledTabButtonType = StyledTabProps & {
  isSelected: boolean;
};

type StyledTabType = FC<StyledTabProps> & {
  List: FC<{ children: ReactNode }>;
  Button: FC<StyledTabButtonType>;
  ListDiv: FC<{ children: ReactNode }>;
  Group: typeof Tab.Group;
  Panels: typeof Tab.Panels;
  Panel: typeof Tab.Panel;
};

export const StyledTabButton: FC<StyledTabButtonType> = ({
  name,
  isSelected,
  icon: Icon,
}) => (
  <div className="group flex rounded-md focus:outline-none focus-visible:ring-offset-gray-100 hover:bg-gray-300 mx-px">
    <span
      className={clsx(
        "p-1 pl-2.5 pr-2.5 rounded-md flex items-center text-sm font-medium",
        isSelected && "bg-white shadow-sm ring-1 ring-black ring-opacity-5"
      )}
    >
      {Icon && (
        <Icon
          className={clsx(
            "-ml-0.5 mr-1.5 h-4 w-4",
            isSelected
              ? "text-gray-500"
              : "text-gray-400 group-hover:text-gray-600"
          )}
        />
      )}
      <span
        className={clsx(
          isSelected
            ? "text-gray-900"
            : "text-gray-600 group-hover:text-gray-900",
          !Icon && "px-1"
        )}
      >
        {name}
      </span>
    </span>
  </div>
);

export const StyledTab: StyledTabType = (props) => (
  <Tab as={Fragment}>
    {({ selected }) => <StyledTabButton {...props} isSelected={selected} />}
  </Tab>
);

const tabListStyle =
  "flex w-fit py-0.5 px-0.5 rounded-md bg-gray-100 hover:bg-gray-200";

StyledTab.List = function StyledTabList({ children }) {
  return <Tab.List className={tabListStyle}>{children}</Tab.List>;
};

StyledTab.ListDiv = function ListDiv({ children }) {
  return <div className={tabListStyle}>{children}</div>;
};

StyledTab.Group = Tab.Group;
StyledTab.Button = StyledTabButton;
StyledTab.Panels = Tab.Panels;
StyledTab.Panel = Tab.Panel;
