"use client";

import { FC } from "react";

import clsx from "clsx";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

type MenuItem = {
  segment: string | null;
  link: string;
  title: string;
};

const menu: MenuItem[] = [
  {
    segment: null,
    link: "/",
    title: "Search",
  },
  {
    segment: "tools",
    link: "/tools",
    title: "Tools",
  },
  {
    segment: "about",
    link: "/about",
    title: "About",
  },
];

export const NavMenu: FC = () => {
  const segment = useSelectedLayoutSegment();

  return (
    <div className="flex space-x-4">
      {menu.map((item) => (
        <Link
          href={item.link}
          passHref
          key={item.segment || "_null"}
          className={clsx(
            "cursor-pointer border-b-2 px-2 py-4 text-sm font-medium no-underline sm:text-lg",
            segment === item.segment
              ? "border-blue-700 text-blue-700"
              : "border-transparent text-gray-400 hover:border-blue-500 hover:text-blue-500"
          )}
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
};
