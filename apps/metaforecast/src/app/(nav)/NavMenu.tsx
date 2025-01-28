"use client";

import { FC } from 'react';

import clsx from 'clsx';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

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
            "no-underline py-4 px-2 text-sm sm:text-lg font-medium cursor-pointer border-b-2",
            segment === item.segment
              ? "text-blue-700 border-blue-700"
              : "text-gray-400 hover:text-blue-500 hover:border-blue-500 border-transparent"
          )}
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
};
