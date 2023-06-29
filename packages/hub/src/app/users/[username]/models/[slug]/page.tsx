"use client";

import { useModelPageQuery } from "./ModelPage";
import { EditModelPageBody } from "./EditModelPageBody";
import { useFixModelUrlCasing } from "./FixModelUrlCasing";

export default function Page({
  params,
}: {
  params: { username: string; slug: string };
}) {
  const modelRef = useModelPageQuery({
    ownerUsername: params.username,
    slug: params.slug,
  });

  useFixModelUrlCasing(modelRef);

  return <EditModelPageBody modelRef={modelRef} />;
}
