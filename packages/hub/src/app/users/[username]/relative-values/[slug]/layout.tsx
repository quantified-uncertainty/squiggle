import { Metadata } from "next";
import { PropsWithChildren } from "react";

import { DefinitionLayout } from "./DefinitionLayout";

type Props = PropsWithChildren<{
  params: { username: string; slug: string };
}>;

export default function Layout(props: Props) {
  return <DefinitionLayout {...props} />;
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: `${params.username}/${params.slug}` };
}
