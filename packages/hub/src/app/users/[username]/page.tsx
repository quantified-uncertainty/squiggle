"use client";

import { UserView } from "./UserView";

export default function UserPage({ params }: { params: { username: string } }) {
  return <UserView username={params.username} />;
}
