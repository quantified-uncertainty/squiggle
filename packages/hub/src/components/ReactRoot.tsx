"use client";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { FC, PropsWithChildren } from "react";
import { RelayEnvironmentProvider } from "react-relay";

import { WithToasts } from "@quri/ui";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getCurrentEnvironment } from "@/relay/environment";

// This component is used in the app's root layout to configure all common providers and wrappers.
// It's also useful when you want to mount a separate React root. One example is CodeMirror tooltips, which are mounted as separate DOM elements.
export const ReactRoot: FC<PropsWithChildren<{ session: Session | null }>> = ({
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
