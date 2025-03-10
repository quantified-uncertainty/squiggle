import { FC } from "react";

import { StyledLink } from "@/components/ui/StyledLink";
import { userRoute } from "@/lib/routes";

export const UsernameLink: FC<{ username: string }> = ({ username }) => {
  return <StyledLink href={userRoute({ username })}>{username}</StyledLink>;
};
