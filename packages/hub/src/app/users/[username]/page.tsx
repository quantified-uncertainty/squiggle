import { Metadata, ResolvingMetadata } from "next";
import { UserView } from "./UserView";

type Props = {
  params: { username: string };
};

export default function UserPage({ params }: Props) {
  return (
    <div className="mt-16 max-w-2xl mx-auto">
      <UserView username={params.username} />
    </div>
  );
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return { title: `${params.username} | ${(await parent).title?.absolute}` };
}
