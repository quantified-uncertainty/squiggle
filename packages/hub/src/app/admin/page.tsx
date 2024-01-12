import { Metadata } from "next";

import { StyledLink } from "@/components/ui/StyledLink";

export default async function OuterAdminPage() {
  // permissions are checked in ./layout.tsx

  return (
    <div className="flex flex-col gap-2">
      <StyledLink href="/admin/search">Search</StyledLink>
      <StyledLink href="/admin/upgrade-versions">Upgrade versions</StyledLink>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Admin",
};
