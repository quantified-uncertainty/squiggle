import { FC, ReactNode } from "react";
import { formatDistance } from "date-fns";
import Link from "next/link";

import { EntityInfo, EntityNode } from "./EntityInfo";
import { IconProps } from "@quri/ui";

export type { EntityNode };

type Props = {
  icon: FC<IconProps>;
  updatedAtTimestamp: number;
  href: string;
  showOwner: boolean;
  ownerName?: string;
  slug: string;
  children?: ReactNode;
};

export const EntityCard: FC<Props> = ({
  icon: Icon,
  updatedAtTimestamp,
  href,
  showOwner,
  ownerName,
  slug,
  children,
}) => {
  return (
    <div className="shadow p-3 rounded flex bg-white">
      <Icon size={20} className="mt-3 ml-1 mr-3 text-slate-300" />
      <div className="w-full">
        <Link className="group" href={href}>
          <div className="text-md font-semibold mb-1 text-blue-500 group-hover:underline">
            {`${!!showOwner ? ownerName + "/" : ""}${slug}`}
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
  );
};
