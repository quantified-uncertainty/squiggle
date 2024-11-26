import { Metadata } from "next";

import { auth } from "@/auth";

import { ChooseUsername } from "./ChooseUsername";

export default async function OuterChooseUsernamePage() {
  const session = await auth();
  return <ChooseUsername session={session} />;
}

export const metadata: Metadata = {
  title: "Pick a username",
};
