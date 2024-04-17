"use client";

import { Tab } from "@headlessui/react";
import { clsx } from "clsx";
import { FC, Fragment, ReactNode } from "react";

import { IconProps } from "../index.js";

type StyledTabProps = {
  name: string;
  icon?: FC<IconProps>;
};

type StyledTabButtonType = StyledTabProps & {
  isSelected: boolean;
};

type StyledTabType = FC<StyledTabProps> & {
  TabStyle: string;
  List: FC<{ children: ReactNode }>;
  Button: FC<StyledTabButtonType>;
  ListDiv: FC<{ children: ReactNode }>;
  Group: typeof Tab.Group;
  Panels: typeof Tab.Panels;
  Panel: typeof Tab.Panel;
};

const tabStyle =
  "group flex rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 hover:bg-gray-100 mx-1 cursor-pointer transition-colors duration-200";

const StyledTabInner: FC<StyledTabButtonType> = ({
  name,
  isSelected,
  icon: Icon,
}) => (
  <>
    <span
      className={clsx(
        "flex items-center rounded-md px-3 py-2 text-sm font-medium",
        isSelected
          ? "bg-gray-600 text-white shadow-sm"
          : "text-gray-500 hover:text-gray-900"
      )}
    >
      {Icon && (
        <Icon
          className={clsx(
            "-ml-0.5 mr-1.5 h-5 w-5",
            isSelected
              ? "text-white"
              : "text-gray-400 group-hover:text-gray-500"
          )}
        />
      )}
      <span>{name}</span>
    </span>
  </>
);

export const StyledTab: StyledTabType = ({ name, icon: Icon }) => (
  <Tab as={Fragment}>
    {({ selected }) => (
      <button className={StyledTab.TabStyle}>
        <StyledTabInner icon={Icon} name={name} isSelected={selected} />
      </button>
    )}
  </Tab>
);

const StyledTabButton: FC<StyledTabButtonType> = (props) => (
  <div className={tabStyle}>
    <StyledTabInner {...props} />
  </div>
);

const tabListStyle = "flex space-x-1 rounded-md bg-gray-100 p-1";

StyledTab.List = function StyledTabList({ children }) {
  return <Tab.List className={tabListStyle}>{children}</Tab.List>;
};

StyledTab.ListDiv = function ListDiv({ children }) {
  return <div className={tabListStyle}>{children}</div>;
};

StyledTab.TabStyle = tabStyle;
StyledTab.Group = Tab.Group;
StyledTab.Button = StyledTabButton;
StyledTab.Panels = Tab.Panels;
StyledTab.Panel = Tab.Panel;
