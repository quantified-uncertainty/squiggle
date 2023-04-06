import React, {
  Fragment,
  PropsWithChildren,
  createContext,
  useContext,
} from "react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// based on StyledTab

type StyledTabLinkProps = {
  name: string;
  href: string;
  icon?: (props: React.ComponentProps<"svg">) => JSX.Element;
};

type StyledTabLinkType = React.FC<StyledTabLinkProps> & {
  List: React.FC<PropsWithChildren<{ selected?: string }>>;
};

const StyledTabLinkContext = createContext<{ selected?: string }>({
  selected: undefined,
});

export const StyledTabLink: StyledTabLinkType = ({
  name,
  href,
  icon: Icon,
}) => {
  const { selected } = useContext(StyledTabLinkContext);

  const pathname = usePathname();

  return (
    <Link href={href}>
      <button className="group flex rounded-md focus:outline-none focus-visible:ring-offset-gray-100">
        <span
          className={clsx(
            "p-1 pl-2.5 pr-3.5 rounded-md flex items-center text-sm font-medium",
            pathname === href &&
              "bg-white shadow-sm ring-1 ring-black ring-opacity-5"
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
    </Link>
  );
};

StyledTabLink.List = function StyledTabLinkList({ children, selected }) {
  return (
    <StyledTabLinkContext.Provider value={{ selected }}>
      <div className="flex w-fit p-0.5 rounded-md bg-slate-100 hover:bg-slate-200">
        {children}
      </div>
    </StyledTabLinkContext.Provider>
  );
};
