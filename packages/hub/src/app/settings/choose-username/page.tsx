import { Metadata } from "next";

import { ChooseUsername } from "./ChooseUsername";

export default function ChooseUsernamePage() {
  return <ChooseUsername />;
}

export const metadata: Metadata = {
  title: "Pick a username",
};
