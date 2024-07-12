import NextLink, { LinkProps } from "next/link";
import { forwardRef, useMemo } from "react";

import {
  useInterceptLink,
  useIsIntercepting,
} from "../NavigationBlocker/hooks";

// Link type, copy-pasted from next/link for reference:

// declare const Link: React.ForwardRefExoticComponent<Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof InternalLinkProps> & InternalLinkProps & {
//     children?: React.ReactNode;
// } & React.RefAttributes<HTMLAnchorElement>>;

export const Link = forwardRef<
  HTMLAnchorElement,
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
    LinkProps & {
      children?: React.ReactNode;
    }
>(function Link({ onClick, ...props }, ref) {
  const isIntercepting = useIsIntercepting();
  const interceptLink = useInterceptLink();

  const patchedOnClick = useMemo(() => {
    return (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isIntercepting()) {
        return onClick?.(e);
      }
      interceptLink(e.currentTarget.href);
      e.preventDefault();
    };
  }, [onClick, isIntercepting, interceptLink]);

  return <NextLink ref={ref} {...props} onClick={patchedOnClick} />;
});
