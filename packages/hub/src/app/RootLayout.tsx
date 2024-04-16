"use client";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { FC, PropsWithChildren } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import { isModelRoute } from "@/routes";

import { PageFooter } from "../components/layout/RootLayout/PageFooter";
import { PageMenu } from "../components/layout/RootLayout/PageMenu";
import { ReactRoot } from "../components/ReactRoot";

import { RootLayoutQuery } from "@/__generated__/RootLayoutQuery.graphql";

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

  return (
    <div className={"flex min-h-screen flex-col bg-white"}>
      <PageMenu queryRef={queryData} />
      <div
        // This allows us to center children vertically if necessary, e.g. in `not-found.tsx`.
        // Note that setting `height: 100%` instead of `flex-1` on children won't work;
        // see https://stackoverflow.com/questions/8468066/child-inside-parent-with-min-height-100-not-inheriting-height for details.
        className="flex flex-1 flex-col"
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
    <ReactRoot session={session}>
      <InnerRootLayout>{children}</InnerRootLayout>
    </ReactRoot>
  );
};
