"use client";
import { FC, PropsWithChildren, useMemo } from "react";

import { createClient, ssrExchange, UrqlProvider } from "@urql/next";

import { getUrqlClientOptions } from "../web/urql";

// client component for top-level providers
export const Root: FC<PropsWithChildren> = ({ children }) => {
  const [client, ssr] = useMemo(() => {
    const ssr = ssrExchange({
      isClient: typeof window !== "undefined",
    });
    const client = createClient({
      ...getUrqlClientOptions(ssr),
      // this causes an infinite loop for some reason; also not sure if necessary with modern React
      //   suspense: true,
    });

    return [client, ssr];
  }, []);

  return (
    <UrqlProvider client={client} ssr={ssr}>
      {children}
    </UrqlProvider>
  );
};
