import { Metadata } from "next";
import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";

import { UserLayout } from "./UserLayout";

import QueryNode, {
  UserLayoutQuery,
} from "@/__generated__/UserLayoutQuery.graphql";

type Props = {
  params: { username: string };
};

export default async function OuterUserLayout({
  params,
  children,
}: PropsWithChildren<Props>) {
  const query = await loadPageQuery<UserLayoutQuery>(QueryNode, {
    username: params.username,
  });

  return (
    <NarrowPageLayout>
      <UserLayout query={query}>{children}</UserLayout>
    </NarrowPageLayout>
  );
}

export function generateMetadata({ params }: Props): Metadata {
  return { title: params.username };
}
