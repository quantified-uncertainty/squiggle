// eslint-disable-next-line no-restricted-imports
import NextLink, { LinkProps } from "next/link";
import { forwardRef, useMemo } from "react";

import {
  useInterceptLink,
  useIsIntercepting,
} from "../NavigationBlocker/hooks";

// This component patches the original <Link> from next/link to intercept clicks and prevent navigation if the user is on the page that should be blocked with `NavigationBlocker`.

export const Link = forwardRef<
  HTMLAnchorElement,
  // type copy-pasted from next/link
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
