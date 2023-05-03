import { PropsWithChildren } from "react";

import { App } from "./App";

import "@/styles/main.css";
import "@quri/squiggle-components/dist/main.css";

async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <App>{children}</App>
      </body>
    </html>
  );
}

export default RootLayout;
