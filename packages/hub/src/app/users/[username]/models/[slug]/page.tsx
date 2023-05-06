"use client";

import { ModelView } from "./ModelView";

export default function ModelPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  return <ModelView {...params} />;
}
