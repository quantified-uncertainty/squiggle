import { FC } from "react";

import { UsernameLink } from "./UsernameLink";
import { CodeBracketIcon } from "@quri/ui";

// works both for models and for definitions
export const EntityInfo: FC<{ username: string; slug: string }> = ({
  username,
  slug,
}) => {
  return (
    <div className="flex justify-between w-full">
      <div className="flex items-center mr-3 group cursor-pointer">
        <span className="text-xl font-medium text-blue-600 group-hover:underline">
          {slug}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-slate-500">by</span>{" "}
        <UsernameLink username={username} />
      </div>
    </div>
  );
};
