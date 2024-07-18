"use client";
// eslint-disable-next-line no-restricted-imports
import NextLink, { LinkProps } from "next/link";
import { forwardRef, useMemo } from "react";

import {
  useConfirmNavigation,
  useIsExitConfirmationActive,
} from "../ExitConfirmationWrapper/hooks";

// This component patches the original <Link> from next/link to intercept clicks and prevent navigation if the user is on the page that should be blocked with `NavigationBlocker`.

export const Link = forwardRef<
  HTMLAnchorElement,
  // type copy-pasted from next/link
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
    LinkProps & {
      children?: React.ReactNode;
    }
>(function Link({ onClick, ...props }, ref) {
  const isConfirmationActive = useIsExitConfirmationActive();
  const confirmNavigation = useConfirmNavigation();

  const patchedOnClick = useMemo(() => {
    return (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isConfirmationActive()) {
        return onClick?.(e);
      }
      confirmNavigation(e.currentTarget.href);
      e.preventDefault();
    };
  }, [onClick, isConfirmationActive, confirmNavigation]);

  return <NextLink ref={ref} {...props} onClick={patchedOnClick} />;
});
