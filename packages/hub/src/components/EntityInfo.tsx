import { FC } from "react";

import { UsernameLink } from "./UsernameLink";

// works both for models and for definitions
export const EntityInfo: FC<{ username: string; slug: string }> = ({
  username,
  slug,
}) => {
  return (
    <div>
      <span className="text-xl font-bold">{slug}</span> by{" "}
      <UsernameLink username={username} />
    </div>
  );
};
