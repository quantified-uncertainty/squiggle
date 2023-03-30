import { useAllInterfaces } from "@/storage/StorageProvider";
import { InterfaceWithModels } from "@/types";
import { FC } from "react";
import { StyledLink } from "./ui/StyledLink";

const Count: FC<{ number: number; text: string }> = ({ number, text }) => (
  <div>
    <strong>{number}</strong> {text}
    {number > 1 && "s"}
  </div>
);

const InterfaceCard: FC<{ data: InterfaceWithModels }> = ({ data }) => {
  return (
    <div key={data.catalog.id}>
      <StyledLink href={`/interfaces/${data.catalog.id}`}>
        {data.catalog.title}
      </StyledLink>
      <div className="flex gap-4">
        <Count number={data.models.size} text="estimate" />
        <Count number={data.catalog.items.length} text="item" />
      </div>
    </div>
  );
};

export const InterfaceList: FC = () => {
  const allInterfaces = useAllInterfaces();

  return (
    <div className="max-w-6xl mx-auto">
      <header className="text-3xl mb-8">Interfaces</header>
      <div className="flex flex-col gap-8 mb-8">
        {allInterfaces.map((interfaceWithModels, i) => (
          <InterfaceCard key={i} data={interfaceWithModels} />
        ))}
      </div>
      <StyledLink href="/scratchpad">From JSON</StyledLink>
    </div>
  );
};
