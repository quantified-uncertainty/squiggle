import { InterfaceList } from "@/components/InterfaceList";
import { Layout } from "@/components/Layout";

export default function IndexPage() {
  return (
    <Layout>
      <main className="p-1 mt-8">
        <InterfaceList />
      </main>
    </Layout>
  );
}
