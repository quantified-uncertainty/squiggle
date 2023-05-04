import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { StyledLink } from "@/components/ui/StyledLink";
import { graphqlPlaygroundRoute } from "@/routes";

export default function ChooseUsernamePage() {
  useSession({
    required: true,
  });

  return (
    <div className="flex flex-col items-center gap-2 mt-20">
      <div>Pick a username:</div>
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="username"
          className="px-2 py-1 border rounded"
        />
        <Button>Save</Button>
      </div>
      <div className="text-xs mt-4 w-80">
        This form is not working yet. Go to{" "}
        <StyledLink
          href={graphqlPlaygroundRoute(`mutation setUsername {
  setUsername(username: WRITE_YOUR_USERNAME_HERE) {
    email
    username
  }
}`)}
        >
          GraphQL playground
        </StyledLink>{" "}
        and call <code>setUsername</code> mutation.
      </div>
    </div>
  );
}
