"use client";

import { useSession } from "next-auth/react";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { LockIcon } from "@quri/ui";

import { H1 } from "@/components/ui/Headers";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";

import { UpgradeModels } from "./UpgradeModels";

import { AdminPageQuery } from "@/__generated__/AdminPageQuery.graphql";

const Query = graphql`
  query AdminPageQuery {
    ...UpgradeModels
  }
`;

export const AdminPage: FC<{
  query: SerializablePreloadedQuery<AdminPageQuery>;
}> = ({ query }) => {
  useSession({ required: true });

  const [queryRef] = usePageQuery(Query, query);

  return (
    <div>
      <H1>
        <div className="flex gap-1 items-center">
          <LockIcon />
          <span>Admin console</span>
        </div>
      </H1>
      <UpgradeModels queryRef={queryRef} />
    </div>
  );
};
