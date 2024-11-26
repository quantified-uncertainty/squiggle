"use client";
import { FC, PropsWithChildren } from "react";
import { RelayEnvironmentProvider } from "react-relay";

import { WithToasts } from "@quri/ui";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getCurrentEnvironment } from "@/relay/environment";

import { ExitConfirmationWrapper } from "./ExitConfirmationWrapper";

// This component is used in the app's root layout to configure all common providers and wrappers.
// It's also useful when you want to mount a separate React root. One example is CodeMirror tooltips, which are mounted as separate DOM elements.
export const ReactRoot: FC<PropsWithChildren> = ({ children }) => {
  const environment = getCurrentEnvironment();

  return (
    <RelayEnvironmentProvider environment={environment}>
      <ExitConfirmationWrapper>
        <WithToasts>
          <ErrorBoundary>{children}</ErrorBoundary>
        </WithToasts>
      </ExitConfirmationWrapper>
    </RelayEnvironmentProvider>
  );
};
