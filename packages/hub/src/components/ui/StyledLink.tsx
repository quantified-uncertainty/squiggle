import clsx from "clsx";

import { Link } from "./Link";

export const StyledLink: React.FC<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
> = ({ className, ...props }) => (
  <Link
    {...props}
    className={clsx(className, "text-blue-500 hover:underline")}
  />
);
