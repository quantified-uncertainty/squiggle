"use client";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { FC, PropsWithChildren } from "react";
import { RelayEnvironmentProvider } from "react-relay";

import { RootLayout } from "@/components/layout/RootLayout";
import { getCurrentEnvironment } from "@/graphql/relayEnvironment";
import { WithToasts } from "@quri/ui";
import { SquiggleContainer } from "@quri/squiggle-components";

export const ClientApp: FC<PropsWithChildren<{ session: Session | null }>> = ({
  session,
  children,
}) => {
  const environment = getCurrentEnvironment();

  return (
    <SessionProvider session={session}>
      <RelayEnvironmentProvider environment={environment}>
        <WithToasts>
          <RootLayout>
            <SquiggleContainer>{children}</SquiggleContainer>
          </RootLayout>
        </WithToasts>
      </RelayEnvironmentProvider>
    </SessionProvider>
  );
};
