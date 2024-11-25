import { Metadata } from "next";
import { PropsWithChildren } from "react";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";

import { UserLayout } from "./UserLayout";

import QueryNode, {
  UserLayoutQuery,
} from "@/__generated__/UserLayoutQuery.graphql";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function OuterUserLayout({
  params,
  children,
}: PropsWithChildren<Props>) {
  const { username } = await params;
  const query = await loadPageQuery<UserLayoutQuery>(QueryNode, {
    username,
  });

  return (
    <NarrowPageLayout>
      <UserLayout query={query}>{children}</UserLayout>
    </NarrowPageLayout>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}
