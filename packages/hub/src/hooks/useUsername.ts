import { useSession } from "next-auth/react";

export function useUsername(): string | undefined {
  const { data: session } = useSession();
  return session?.user?.username;
}
