"use client";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { FC, PropsWithChildren } from "react";
import { RelayEnvironmentProvider } from "react-relay";

import { WithToasts } from "@quri/ui";

import { getCurrentEnvironment } from "@/relay/environment";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const ClientApp: FC<PropsWithChildren<{ session: Session | null }>> = ({
  session,
  children,
}) => {
  const environment = getCurrentEnvironment();

  return (
    <SessionProvider session={session}>
      <RelayEnvironmentProvider environment={environment}>
        <WithToasts>
          <ErrorBoundary>{children}</ErrorBoundary>
        </WithToasts>
      </RelayEnvironmentProvider>
    </SessionProvider>
  );
};
