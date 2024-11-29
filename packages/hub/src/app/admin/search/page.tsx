import { H2 } from "@/components/ui/Headers";
import { ServerActionButton } from "@/components/ui/ServerActionButton";
import { adminRebuildSearchIndexAction } from "@/server/search/actions/adminRebuildSearchIndexAction";
import { checkRootUser } from "@/server/users/auth";

export default async function AdminSearchPage() {
  await checkRootUser();

  return (
    <div>
      <H2>Rebuild search index</H2>
      <ServerActionButton
        action={async () => {
          "use server";
          await adminRebuildSearchIndexAction({});
        }}
        title="Rebuild"
        confirmation="Index updated"
        theme="primary"
      />
    </div>
  );
}
