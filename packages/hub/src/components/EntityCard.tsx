import clsx from "clsx";
import Link from "next/link";
import React, { FC, PropsWithChildren } from "react";

import { LockIcon } from "@quri/ui";

import { EntityNode } from "./EntityInfo";

export type { EntityNode };

export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

export const PrivateBadge: FC = () => (
  <div className="flex items-center text-gray-500">
    <LockIcon className="mr-1" size={12} />
    Private
  </div>
);

export const UpdatedStatus: FC<{ time: number }> = ({ time }) => (
  <div>
    <span className="mr-1">{"Updated"}</span>
    <time dateTime={new Date(time).toISOString()}>
      {formatDate(new Date(time))}
    </time>
  </div>
);

type Props = PropsWithChildren<{
  href: string;
  showOwner: boolean;
  ownerName?: string;
  slug: string;
  menuItems?: React.ReactElement;
  bodyClasses?: string;
}>;

export const EntityCard: FC<Props> = ({
  href,
  showOwner,
  ownerName,
  slug,
  children,
  menuItems,
  bodyClasses = "mt-3 pb-3 px-5",
}) => {
  return (
    <div className="pt-3 rounded bg-white border border-gray-200 hover:bg-gray-50">
      <div className="flex flex-col h-full pt-3">
        <div className="mb-1 px-5">
          <Link
            className="text-gray-900 font-medium hover:underline mb-1"
            href={href}
          >
            {showOwner ? ownerName + "/" : ""}
            {slug}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-gray-500 text-xs mb-2 px-5">
          {menuItems}
        </div>
        {<div className={clsx("flex-grow", bodyClasses)}>{children}</div>}
      </div>
    </div>
  );
};
