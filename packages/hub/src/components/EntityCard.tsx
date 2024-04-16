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

export const badgeCss = (presentAsLink: boolean) => {
  return clsx(
    "flex items-center",
    presentAsLink &&
      "cursor-pointer hover:text-gray-900 hover:underline select-none"
  );
};

export const Badge: FC<PropsWithChildren<{ presentAsLink: boolean }>> = ({
  presentAsLink,
  children,
}) => <div className={badgeCss(presentAsLink)}>{children}</div>;

export const PrivateBadge: FC = () => (
  <Badge presentAsLink={false}>
    <LockIcon className="mr-1" size={10} />
    Private
  </Badge>
);

export const UpdatedStatus: FC<{ time: number }> = ({ time }) => (
  <Badge presentAsLink={false}>
    <span className="mr-1">{"Updated"}</span>
    <time dateTime={new Date(time).toISOString()}>
      {formatDate(new Date(time))}
    </time>
  </Badge>
);

export const keepFirstNLines = (str: string, n: number) =>
  str.split("\n").slice(0, n).join("\n");

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
    <div className="rounded border border-gray-200 bg-white pt-3 hover:bg-gray-50">
      <div className="flex h-full flex-col pt-3">
        <div className="mb-1 px-5">
          <Link
            className="mb-1 font-medium text-gray-900 hover:underline"
            href={href}
          >
            {showOwner ? ownerName + "/" : ""}
            {slug}
          </Link>
        </div>
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-2 px-5 text-xs text-gray-500">
          {menuItems}
        </div>
        {<div className={clsx("flex-grow", bodyClasses)}>{children}</div>}
      </div>
    </div>
  );
};
