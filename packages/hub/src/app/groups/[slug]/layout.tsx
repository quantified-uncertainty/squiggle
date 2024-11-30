import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PropsWithChildren } from "react";

import { GroupIcon } from "@quri/ui";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { H1 } from "@/components/ui/Headers";
import {
  StyledTabLink,
  StyledTabLinkList,
} from "@/components/ui/StyledTabLink";
import { loadGroupCard } from "@/groups/data/groupCards";
import { hasGroupMembership } from "@/groups/data/helpers";
import { groupMembersRoute, groupRoute } from "@/lib/routes";

import { NewModelButton } from "./NewModelButton";

type Props = PropsWithChildren<{
  params: Promise<{ slug: string }>;
}>;

export default async function GroupLayout({ params, children }: Props) {
  const { slug } = await params;
  const group = await loadGroupCard(slug);
  if (!group) {
    notFound();
  }

  const isMember = await hasGroupMembership(slug);

  return (
    <NarrowPageLayout>
      <div className="space-y-8">
        <H1 size="large">
          <div className="flex items-center">
            <GroupIcon className="mr-2 opacity-50" />
            {group.slug}
          </div>
        </H1>
        <div className="flex items-center gap-2">
          <StyledTabLinkList>
            <StyledTabLink
              name="Models"
              href={groupRoute({ slug: group.slug })}
            />
            <StyledTabLink
              name="Members"
              href={groupMembersRoute({ slug: group.slug })}
            />
          </StyledTabLinkList>
          {isMember && <NewModelButton group={group.slug} />}
        </div>
        <div>{children}</div>
      </div>
    </NarrowPageLayout>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}
