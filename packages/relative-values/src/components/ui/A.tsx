import clsx from "clsx";

export const A: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({
  className,
  ...props
}) => (
  <a {...props} className={clsx(className, "text-blue-500 hover:underline")} />
);
