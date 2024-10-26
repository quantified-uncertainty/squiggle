import { HomeLayout } from "fumadocs-ui/layouts/home";
import { Metadata } from "next";
import type { PropsWithChildren } from "react";

import { Footer } from "@/components/Footer";

import { baseOptions } from "../../layout.config";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col justify-between">
      <HomeLayout {...baseOptions}>
        <div className="mt-2">{children}</div>
      </HomeLayout>
      <Footer />
    </div>
  );
}

export const metadata: Metadata = {
  title: "Squiggle",
  description:
    "A simple programming language for intuitive probabilistic estimation",
};
