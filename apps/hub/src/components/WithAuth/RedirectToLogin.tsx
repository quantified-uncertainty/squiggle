"use client";

import { redirect, usePathname } from "next/navigation";
import { FC } from "react";

export const RedirectToLogin: FC = () => {
  const pathname = usePathname();
  redirect(`/api/auth/signin?callbackUrl=${pathname}`);
};
