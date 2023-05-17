import { Metadata, ResolvingMetadata } from "next";
import { UserView } from "./UserView";
import { NarrowPageLayout } from "@/components/layout/NarrowPageLayout";

type Props = {
  params: { username: string };
};

export default function UserPage({ params }: Props) {
  return (
    <NarrowPageLayout>
      <UserView username={params.username} />
    </NarrowPageLayout>
  );
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return { title: `${params.username} | ${(await parent).title?.absolute}` };
}
