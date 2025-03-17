"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import { Button, ButtonProps } from "@quri/ui";

export const LinkButton: FC<
  Omit<ButtonProps, "onClick"> & { href: string }
> = ({ href, ...props }) => {
  const router = useRouter();

  return <Button onClick={() => router.push(href)} {...props} />;
};
