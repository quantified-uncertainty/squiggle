import { FC } from "react";

import { UsernameLink } from "./UsernameLink";
import Link from "next/link";

// works both for models and for definitions
export const EntityInfo: FC<{
  username: string;
  slug: string;
  href: string;
}> = ({ username, slug, href }) => {
  return (
    <div className="flex justify-between w-full">
      <div className="flex items-center mr-3 group cursor-pointer">
        <Link
          className="text-lg font-medium text-blue-600 group-hover:underline"
          href={href}
        >
          {slug}
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-slate-500">by</span>{" "}
        <UsernameLink username={username} />
      </div>
    </div>
  );
};
