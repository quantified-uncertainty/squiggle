import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/server/auth";

import { ChooseUsername } from "./ChooseUsername";

export default async function OuterChooseUsernamePage() {
  const session = await auth();
  if (!session?.user.email || session.user.username) {
    redirect("/");
  }

  return <ChooseUsername />;
}

export const metadata: Metadata = {
  title: "Pick a username",
};
