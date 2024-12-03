import { H2 } from "@/components/ui/Headers";
import { SafeActionButton } from "@/components/ui/SafeActionButton";
import { adminRebuildSearchIndexAction } from "@/search/actions/adminRebuildSearchIndexAction";
import { checkRootUser } from "@/users/auth";

export default async function AdminSearchPage() {
  await checkRootUser();

  return (
    <div>
      <H2>Rebuild search index</H2>
      <SafeActionButton
        action={adminRebuildSearchIndexAction}
        input={{}}
        title="Rebuild"
        confirmation="Index updated"
        theme="primary"
      />
    </div>
  );
}
