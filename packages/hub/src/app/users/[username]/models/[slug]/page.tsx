"use client";

import { EditModelPageBody } from "./EditModelPageBody";
import { useModelPageQuery } from "./ModelPage";

export default function Page({
  params,
}: {
  params: { username: string; slug: string };
}) {
  const modelRef = useModelPageQuery({
    ownerUsername: params.username,
    slug: params.slug,
  });

  return (
    <div className="bg-white">
      <EditModelPageBody modelRef={modelRef} />
    </div>
  );
}
