import { HomeLayout } from "fumadocs-ui/home-layout";
import type { PropsWithChildren } from "react";

import { Footer } from "@/components/Footer";

import { baseOptions } from "../../layout.config";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col justify-between">
      <HomeLayout {...baseOptions}>{children}</HomeLayout>
      <Footer />
    </div>
  );
}
