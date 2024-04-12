import Link from "next/link";
import React, { FC, PropsWithChildren } from "react";

import { LockIcon } from "@quri/ui";

import { EntityNode } from "./EntityInfo";
import { Card } from "./ui/Card";

export type { EntityNode };

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

type Props = PropsWithChildren<{
  updatedAtTimestamp: number;
  href: string;
  showOwner: boolean;
  isPrivate?: boolean;
  ownerName?: string;
  slug: string;
  footerItems?: React.ReactElement;
}>;

export const EntityCard: FC<Props> = ({
  updatedAtTimestamp,
  href,
  showOwner,
  isPrivate,
  ownerName,
  slug,
  children,
  footerItems,
}) => {
  return (
    <Card>
      <div className="w-full">
        <div className="mb-1">
          <Link
            className="text-gray-900 font-medium hover:underline"
            href={href}
          >
            {showOwner ? ownerName + "/" : ""}
            {slug}
          </Link>
        </div>
        {children && <div>{children}</div>}
        <div className="flex items-center space-x-4 text-gray-500 text-xs mt-2">
          {footerItems}
          {isPrivate && <LockIcon className="400" size={14} />}
          <div>
            <span className="mr-1">Updated</span>
            <time dateTime={new Date(updatedAtTimestamp).toISOString()}>
              {formatDate(new Date(updatedAtTimestamp))}
            </time>
          </div>
        </div>
      </div>
    </Card>
  );
};
