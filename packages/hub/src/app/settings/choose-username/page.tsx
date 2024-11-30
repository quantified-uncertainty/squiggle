import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUserOrRedirect } from "@/users/auth";

import { ChooseUsername } from "./ChooseUsername";

export default async function OuterChooseUsernamePage() {
  const sessionUser = await getSessionUserOrRedirect();
  if (sessionUser.username) {
    redirect("/");
  }

  return <ChooseUsername />;
}

export const metadata: Metadata = {
  title: "Pick a username",
};
