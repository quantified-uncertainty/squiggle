"use client";

import { usePathname } from "next/navigation";
import { FC } from "react";

import { isAiRoute, isModelRoute } from "@/lib/routes";

import { PageFooter } from "./PageFooter";

// This is a client component because it needs to know the current pathname.
// Alternatively, we could use route groups (https://nextjs.org/docs/app/building-your-application/routing/route-groups),
// and then the footer could be RSC. But that would complicate the `app/` tree more than it's worth.
export const PageFooterIfNecessary: FC = () => {
  const pathname = usePathname();

  const showFooter = !isModelRoute(pathname) && !isAiRoute(pathname);

  return showFooter ? <PageFooter /> : null;
};
