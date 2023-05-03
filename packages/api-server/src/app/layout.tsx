"use client";
import { SessionProvider } from "next-auth/react";
import { FC, PropsWithChildren } from "react";

import { App } from "./App";

import "@quri/squiggle-components/dist/main.css";
import "@/styles/main.css";

const RootLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <App>{children}</App>
        </SessionProvider>
      </body>
    </html>
  );
};

export default RootLayout;
