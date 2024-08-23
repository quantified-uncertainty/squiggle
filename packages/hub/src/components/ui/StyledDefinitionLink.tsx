import clsx from "clsx";

import { Link } from "./Link";

export const StyledDefinitionLink: React.FC<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
> = ({ className, ...props }) => (
  <Link
    {...props}
    className={clsx(className, "text-teal-500 hover:underline")}
  />
);
