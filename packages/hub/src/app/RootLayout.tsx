"use client";
import { clsx } from "clsx";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { FC, PropsWithChildren } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { RootLayoutQuery } from "@/__generated__/RootLayoutQuery.graphql";
import { isModelRoute, isModelSubroute } from "@/routes";
import { PageFooter } from "../components/layout/RootLayout/PageFooter";
import { PageMenu } from "../components/layout/RootLayout/PageMenu";
import { ClientApp } from "./ClientApp";

const InnerRootLayout: FC<PropsWithChildren> = ({ children }) => {
  const { data: session } = useSession();
  const queryData = useLazyLoadQuery<RootLayoutQuery>(
    graphql`
      query RootLayoutQuery($signedIn: Boolean!) {
        ...PageMenu @arguments(signedIn: $signedIn)
      }
    `,
    { signedIn: !!session }
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

export const RootLayout: FC<
  PropsWithChildren<{
    session: Session | null;
  }>
> = ({ session, children }) => {
  return (
    <ClientApp session={session}>
      <InnerRootLayout>{children}</InnerRootLayout>
    </ClientApp>
  );
};
