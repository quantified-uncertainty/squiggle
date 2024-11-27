"use client";
import { FC, PropsWithChildren } from "react";
import { RelayEnvironmentProvider } from "react-relay";

import { WithToasts } from "@quri/ui";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getCurrentEnvironment } from "@/relay/environment";

import { ExitConfirmationWrapper } from "./ExitConfirmationWrapper";

type Props = PropsWithChildren<{
  // CodeMirror tooltips are not compatible with ConfirmationWrapper, because they use a separate React root.
  // In a separate root, `useRouter` is not available, because it depends on a global Next.js context.
  // TODO: reimplement CodeMirror editor with portals.
  confirmationWrapper?: boolean;
}>;

// This component is used in the app's root layout to configure all common providers and wrappers.
// It's also useful when you want to mount a separate React root. One example is CodeMirror tooltips, which are mounted as separate DOM elements.
export const ReactRoot: FC<Props> = ({
  children,
  confirmationWrapper = true,
}) => {
  const environment = getCurrentEnvironment();

  let content = (
    <WithToasts>
      <ErrorBoundary>{children}</ErrorBoundary>
    </WithToasts>
  );

  if (confirmationWrapper) {
    content = <ExitConfirmationWrapper>{content}</ExitConfirmationWrapper>;
  }

  return (
    <RelayEnvironmentProvider environment={environment}>
      {content}
    </RelayEnvironmentProvider>
  );
};
