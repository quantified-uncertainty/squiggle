import { Metadata } from "next";
import { FC } from "react";

import { SafeActionButton } from "@/components/ui/SafeActionButton";
import { StyledLink } from "@/components/ui/StyledLink";

import { seedDatabase } from "./actions";

const SeedPage: FC = () => {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Database Seeding</h1>
      <SafeActionButton
        action={seedDatabase}
        input={undefined}
        theme="primary"
        confirmation="Database seeded"
      >
        Seed Database (test speclist and sTest model)
      </SafeActionButton>
      <div className="mt-4">
        <StyledLink href="/admin">← Back to Admin</StyledLink>
      </div>
    </div>
  );
};

export default SeedPage;

export const metadata: Metadata = {
  title: "Admin",
};
