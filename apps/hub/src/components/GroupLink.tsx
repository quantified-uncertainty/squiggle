import { FC } from "react";

import { StyledLink } from "@/components/ui/StyledLink";
import { groupRoute } from "@/lib/routes";

export const GroupLink: FC<{ slug: string }> = ({ slug }) => {
  return <StyledLink href={groupRoute({ slug })}>{slug}</StyledLink>;
};
