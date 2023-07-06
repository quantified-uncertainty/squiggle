import { FC } from "react";

import { UsernameLink } from "./UsernameLink";
import { userRoute } from "@/routes";
import { StyledLink } from "@/components/ui/StyledLink";
import Link from "next/link";

// works both for models and for definitions
export const EntityInfo: FC<{
  username: string;
  slug: string;
  href: string;
}> = ({ username, slug, href }) => {
  return (
    <div className="flex justify-between w-full">
      <div className="flex items-center mr-3">
        <Link
          className="text-lg text-blue-600 hover:underline"
          href={userRoute({ username })}
        >
          {username}
        </Link>
        <div className="text-lg text-gray-400 mx-1">/</div>
        <Link
          className="text-lg font-medium text-blue-600 hover:underline"
          href={href}
        >
          {slug}
        </Link>
      </div>
    </div>
  );
};
