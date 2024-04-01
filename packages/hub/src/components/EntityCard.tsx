import Link from "next/link";
import { FC, PropsWithChildren } from "react";

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
}>;

export const EntityCard: FC<Props> = ({
  updatedAtTimestamp,
  href,
  showOwner,
  isPrivate,
  ownerName,
  slug,
  children,
}) => {
  return (
    <div>
      <Card>
        <div className="flex w-full">
          <div className="w-full">
            <div className="mb-3">
              <Link
                className="text-gray-900 font-medium hover:underline"
                href={href}
              >
                {showOwner ? ownerName + "/" : ""}
                {slug}
              </Link>
            </div>
            <div className="flex flex-row space-x-4 text-gray-500 text-xs">
              {children && <div className="flex">{children}</div>}
              {isPrivate && (
                <div className="flex">
                  {<LockIcon className="400" size={14} />}
                </div>
              )}
              <div className="flex items-center">
                <span className="mr-1">Updated</span>
                <time dateTime={new Date(updatedAtTimestamp).toISOString()}>
                  {formatDate(new Date(updatedAtTimestamp))}
                </time>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
