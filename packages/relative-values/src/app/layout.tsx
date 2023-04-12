"use client";
import Link from "next/link";
import { PropsWithChildren } from "react";

import "@quri/squiggle-components/dist/main.css";
import "../styles/main.css";

import { Tailwind } from "@/components/Tailwind";
import { StorageProvider } from "@/storage/StorageProvider";

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <Tailwind>
          <StorageProvider>
            <div className="min-h-screen">
              <div className="bg-white border-b border-slate-300">
                <div className="max-w-6xl mx-auto">
                  <Link href="/">
                    <div className="text-lg font-bold py-2 text-slate-600">
                      Relative Values App
                    </div>
                  </Link>
                </div>
              </div>
              {children}
            </div>
          </StorageProvider>
        </Tailwind>
      </body>
    </html>
  );
}
