import { formatDistance } from "date-fns";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import { IconProps, LockIcon } from "@quri/ui";

import { EntityNode } from "./EntityInfo";
import { Card } from "./ui/Card";

export type { EntityNode };

type Props = PropsWithChildren<{
  icon: FC<IconProps>;
  updatedAtTimestamp: number;
  href: string;
  showOwner: boolean;
  isPrivate?: boolean;
  ownerName?: string;
  slug: string;
}>;

export const EntityCard: FC<Props> = ({
  icon: Icon,
  updatedAtTimestamp,
  href,
  showOwner,
  isPrivate,
  ownerName,
  slug,
  children,
}) => {
  return (
    <Card>
      <div className="flex">
        <Icon size={20} className="mt-3 ml-1 mr-3 text-slate-300" />
        <div className="w-full">
          <Link className="group" href={href}>
            <div className="flex items-center gap-1 mb-1">
              <div className="text-md font-semibold text-blue-500 group-hover:underline">
                {showOwner ? ownerName + "/" : ""}
                {slug}
              </div>
              {isPrivate && <LockIcon className="text-slate-500" size={14} />}
            </div>
            <div className="text-xs text-slate-500">
              Updated{" "}
              <time dateTime={new Date(updatedAtTimestamp).toISOString()}>
                {formatDistance(new Date(updatedAtTimestamp), new Date(), {
                  addSuffix: true,
                })}
              </time>
            </div>
          </Link>
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>
    </Card>
  );
};
