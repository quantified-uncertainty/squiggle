"use client";

import { ModelRevisionView } from "./ModelRevisionView";

export default function ModelPage({
  params,
}: {
  params: { username: string; slug: string; revisionId: string };
}) {
  return (
    <div className="p-4">
      <ModelRevisionView {...params} />
    </div>
  );
}
