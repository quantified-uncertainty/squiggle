import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { PropsWithChildren } from "react";

import { baseOptions } from "../../layout.config";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col justify-between">
      <HomeLayout {...baseOptions}>
        <div className="mt-1">{children}</div>
      </HomeLayout>
    </div>
  );
}
