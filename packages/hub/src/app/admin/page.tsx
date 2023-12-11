import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { FC } from "react";

import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";
import { loadPageQuery } from "@/relay/loadPageQuery";

import { authOptions } from "../api/auth/[...nextauth]/authOptions";
import { AdminPage } from "./AdminPage";

import QueryNode, {
  AdminPageQuery,
} from "@/__generated__/AdminPageQuery.graphql";

const OuterAdminPageAuthenticated: FC = async () => {
  const query = await loadPageQuery<AdminPageQuery>(QueryNode, {});

  return (
    <FullLayoutWithPadding>
      <AdminPage query={query} />
    </FullLayoutWithPadding>
  );
};

export default async function OuterAdminPage() {
  const session = await getServerSession(authOptions);

  const email = session?.user.email;
  if (!email || !process.env.ROOT_EMAILS?.includes(email)) {
    return <NarrowPageLayout>Access denied.</NarrowPageLayout>;
  }

  return <OuterAdminPageAuthenticated />;
}

export const metadata: Metadata = {
  title: "Admin",
};
