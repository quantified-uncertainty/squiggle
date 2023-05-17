import { FC } from "react";

import { UsernameLink } from "./UsernameLink";

export const ModelInfo: FC<{ username: string; slug: string }> = ({
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
