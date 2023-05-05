"use client";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { FC, PropsWithChildren } from "react";
import { RelayEnvironmentProvider } from "react-relay";

import { Layout } from "@/components/layout/Layout";
import { getCurrentEnvironment } from "@/graphql/relayEnvironment";

export const ClientApp: FC<PropsWithChildren<{ session: Session | null }>> = ({
  session,
  children,
}) => {
  const environment = getCurrentEnvironment();

  return (
    <SessionProvider session={session}>
      <RelayEnvironmentProvider environment={environment}>
        <Layout>{children}</Layout>
      </RelayEnvironmentProvider>
    </SessionProvider>
  );
};
