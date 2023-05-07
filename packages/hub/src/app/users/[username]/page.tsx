"use client";

import { UserView } from "./UserView";

export default function UserPage({ params }: { params: { username: string } }) {
  return (
    <div className="mt-16 max-w-2xl mx-auto">
      <UserView username={params.username} />
    </div>
  );
}
