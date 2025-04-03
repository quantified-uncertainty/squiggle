import clsx from "clsx";

// Same as StyledLink, but for external links.
export const StyledA: React.FC<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
> = ({ className, ...props }) => (
  <a {...props} className={clsx(className, "text-blue-500 hover:underline")} />
);
