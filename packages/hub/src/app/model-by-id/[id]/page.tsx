"use client";

import { ModelView } from "./ModelView";

export default function ModelPage({ params }: { params: { id: string } }) {
  return <ModelView id={params.id} />;
}
