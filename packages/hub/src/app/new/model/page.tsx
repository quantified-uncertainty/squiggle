import { Metadata } from "next";
import { fetchQuery, graphql } from "relay-runtime";
import { z } from "zod";

import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { SelectGroupOption } from "@/components/SelectGroup";
import { getCurrentEnvironment } from "@/relay/environment";
import { getSessionUserOrRedirect } from "@/server/users/auth";

import { NewModel } from "./NewModel";

import { pageNewModelQuery } from "@/__generated__/pageNewModelQuery.graphql";

export default async function OuterNewModelPage({
  searchParams,
}: {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}) {
  await getSessionUserOrRedirect();

  const groupSlug = z
    .string()
    .optional()
    .parse((await searchParams)["group"]);

  const environment = getCurrentEnvironment();

  let group: SelectGroupOption | null = null;

  if (groupSlug) {
    const result = await fetchQuery<pageNewModelQuery>(
      environment,
      graphql`
        query pageNewModelQuery($groupSlug: String!) {
          group(slug: $groupSlug) {
            ... on Group {
              id
              slug
              myMembership {
                id
              }
            }
          }
        }
      `,
      { groupSlug }
    ).toPromise();

    if (result?.group?.id && result?.group?.slug) {
      group = {
        id: result.group.id,
        slug: result.group.slug,
      };
    }
  }

  return (
    <NarrowPageLayout>
      <NewModel initialGroup={group} />
    </NarrowPageLayout>
  );
}

export const metadata: Metadata = {
  title: "New model",
};
