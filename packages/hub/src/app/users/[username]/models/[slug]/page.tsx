"use client";

import { ModelView } from "./ModelView";

export default function ModelPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  return (
    <div className="p-4">
      <ModelView {...params} />
    </div>
  );
}
