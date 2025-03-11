import { PropsWithChildren } from "react";

import { FullLayoutWithPadding } from "@/components/layout/FullLayoutWithPadding";
import { H1 } from "@/components/ui/Headers";
import { Link } from "@/components/ui/Link";
import { evaluationsRoute, speclistsRoute } from "@/lib/routes";
import { checkRootUser } from "@/users/auth";

export default async function SpecListsLayout({ children }: PropsWithChildren) {
  await checkRootUser();

  return (
    <FullLayoutWithPadding>
      <div className="mb-6">
        <H1 size="large">
          <Link
            href={speclistsRoute()}
            className="text-gray-600 hover:underline"
          >
            Specs
          </Link>{" "}
          &{" "}
          <Link
            href={evaluationsRoute()}
            className="text-gray-600 hover:underline"
          >
            Evals
          </Link>
        </H1>
        <p className="text-sm text-gray-500">
          Experimental feature - AI evaluations for spec lists
        </p>
      </div>
      {children}
    </FullLayoutWithPadding>
  );
}
