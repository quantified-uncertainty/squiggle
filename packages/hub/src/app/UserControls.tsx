"use client";
import { signIn, signOut } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Session } from "next-auth";

export function UserControls({ session }: { session: Session | null }) {
  return !session?.user ? (
    <Button onClick={() => signIn()}>Sign In</Button>
  ) : (
    <div className="flex items-center gap-2">
      <div>{session.user.email}</div>
      <Button onClick={() => signOut()}>Sign Out</Button>
    </div>
  );
}
