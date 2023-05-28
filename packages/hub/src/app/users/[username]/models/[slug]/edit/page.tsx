"use client";

import { useModelPageQuery } from "../ModelPage";
import { EditModelPageBody } from "./EditModelPageBody";

export default function Page({
  params,
}: {
  params: { username: string; slug: string };
}) {
  const modelRef = useModelPageQuery({
    ownerUsername: params.username,
    slug: params.slug,
  });

  return <EditModelPageBody modelRef={modelRef} />;
}
