import { clsx } from "clsx";
import { FC, ReactNode } from "react";

import { IconProps } from "@/relative-values/components/ui/icons/Icon";

import { Link } from "./ui/Link";

// works both for models and for definitions
export type EntityNode = {
  slug: string;
  href?: string;
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
  const content = (
    <div
      className={clsx(
        "group flex items-center gap-1 py-2 pr-3",
        !isFirst && "pl-3"
      )}
    >
      {!isLast && Icon && (
        <Icon
          className="mr-1 text-gray-600 opacity-50 transition group-hover:opacity-100"
          size={18}
        />
      )}
      <div
        className={clsx("text-lg", isLast ? "text-gray-900" : "text-gray-500")}
      >
        {slug}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link className="hover:underline" href={href}>
        {content}
      </Link>
    );
  } else {
    return content;
  }
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
