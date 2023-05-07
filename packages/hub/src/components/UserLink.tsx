import { FC } from "react";

import { StyledLink } from "@/components/ui/StyledLink";
import { userRoute } from "@/routes";

export const UserLink: FC<{ user: { username: string } }> = ({ user }) => {
  return (
    <StyledLink href={userRoute({ username: user.username })}>
      @{user.username}
    </StyledLink>
  );
};
