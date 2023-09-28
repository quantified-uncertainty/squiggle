"use client";

import { clsx } from "clsx";
import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";
import { usePathname } from "next/navigation";

import { isModelRoute, isModelSubroute } from "@/routes";
import { PageFooter } from "../components/layout/RootLayout/PageFooter";
import { PageMenu } from "../components/layout/RootLayout/PageMenu";
import { usePageQuery } from "@/relay/usePageQuery";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { RootLayoutQuery } from "@/__generated__/RootLayoutQuery.graphql";

export const RootLayout: FC<
  PropsWithChildren<{
    query: SerializablePreloadedQuery<RootLayoutQuery>;
  }>
> = ({ children, query }) => {
  const [queryData] = usePageQuery(
    graphql`
      query RootLayoutQuery($signedIn: Boolean!) {
        ...PageMenu @arguments(signedIn: $signedIn)
      }
    `,
    query
  );

  const pathname = usePathname();

  const showFooter = !isModelRoute(pathname);
  const backgroundColor = isModelSubroute(pathname) ? "bg-white" : "bg-gray-50";

  return (
    <div className={clsx("min-h-screen flex flex-col", backgroundColor)}>
      <PageMenu queryRef={queryData} />
      <div
        // This allows us to center children vertically if necessary, e.g. in `not-found.tsx`.
        // Note that setting `height: 100%` instead of `flex-1` on children won't work;
        // see https://stackoverflow.com/questions/8468066/child-inside-parent-with-min-height-100-not-inheriting-height for details.
        className="flex-1 flex flex-col"
      >
        {children}
      </div>
      {showFooter && <PageFooter />}
    </div>
  );
};
