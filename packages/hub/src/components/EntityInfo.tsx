import Link from "next/link";
import { FC, ReactNode } from "react";

import { IconProps } from "@/relative-values/components/ui/icons/Icon";
import { clsx } from "clsx";

// works both for models and for definitions
export type EntityNode = {
  slug: string;
  href: string;
  icon?: FC<IconProps>;
};

const ListWithSeparator: React.FC<{
  items: ReactNode[];
  separator: (r: number) => ReactNode;
}> = ({ items, separator }) =>
  items
    .map((item, index) =>
      index < items.length - 1 ? [item, separator(index)] : item
    )
    .flat();

const Entity: FC<EntityNode & { isFirst: boolean; isLast: boolean }> = ({
  slug,
  href,
  icon: Icon,
  isFirst,
  isLast,
}) => {
  return (
    <Link
      className={clsx(
        "text-lg text-slate-700 hover:underline flex items-center gap-1 group py-2 pr-3",
        isLast ? "font-semibold" : "",
        !isFirst && "pl-3"
      )}
      href={href}
      key={href}
    >
      {Icon && (
        <Icon
          className="text-slate-600 opacity-50 group-hover:opacity-100 transition mr-1"
          size={18}
        />
      )}
      {slug}
    </Link>
  );
};

export const EntityInfo: FC<{
  nodes: EntityNode[];
}> = ({ nodes }) => {
  const links = nodes.map((node, i) => (
    <Entity
      {...node}
      key={i}
      isFirst={i === 0}
      isLast={i === nodes.length - 1}
    />
  ));
  const separator = (key: number) => (
    <div key={`s${key}`} className="text-lg text-gray-300">
      /
    </div>
  );

  return (
    <div className="flex items-center">
      <ListWithSeparator items={links} separator={separator} />
    </div>
  );
};
