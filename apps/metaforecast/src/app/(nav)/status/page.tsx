import { Card } from "@/web/common/Card";
import { getUrqlRscClient } from "@/web/urql";

import { PlatformsStatusDocument } from "./queries.generated";

export default async function () {
  const client = getUrqlRscClient();

  const data =
    (await client.query(PlatformsStatusDocument, {})).data?.result || null;

  if (!data) {
    throw new Error("No data");
  }

  return (
    <div className="space-y-4">
      <Card>
        <p>
          Metaforecast supports many prediction platforms, and those platforms
          can sometimes change their data format, so that updates stop working.
          We try to fix these from time to time, but sometimes things break down
          for a while.
        </p>
        <p>
          Please complain in{" "}
          <a href="https://discord.gg/nsTnQTgtG6">QURI Discord</a> if you notice
          a problem.
        </p>
      </Card>
      <table className="table-auto border-collapse border border-gray-200 bg-white mx-auto mb-10">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 p-4">Platform</th>
            <th className="border border-gray-200 p-4">Last updated</th>
          </tr>
        </thead>
        <tbody>
          {data.map((platform) => {
            const ts = platform.lastUpdated
              ? new Date(platform.lastUpdated * 1000)
              : null;
            const isStale =
              !ts || new Date().getTime() - ts.getTime() > 2 * 86400 * 1000;
            return (
              <tr key={platform.id}>
                <td
                  className={`border border-gray-200 p-4 ${
                    isStale ? "bg-red-300" : ""
                  }`}
                >
                  {platform.label}
                </td>
                <td className="border border-gray-200 p-4">
                  <div className="text-sm">{ts ? String(ts) : null}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const dynamic = "force-dynamic";
