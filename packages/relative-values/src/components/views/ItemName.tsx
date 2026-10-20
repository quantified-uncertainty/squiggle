"use client";
import { FC } from "react";

import { Item } from "../../types.js";
import { usePresentation } from "../host/presentation.js";

/**
 * Item name, rendered with the `renderItemName` option and clickable with the
 * `onItemClick` option.
 */
export const ItemName: FC<{ item: Item }> = ({ item }) => {
  const { renderItemName, onItemClick } = usePresentation().options;
  const content = renderItemName ? renderItemName(item) : item.name;

  if (!onItemClick) {
    // Custom content (e.g. a link) shouldn't trigger the surrounding UI's
    // click handlers.
    return renderItemName ? (
      <span onClick={(event) => event.stopPropagation()}>{content}</span>
    ) : (
      <>{content}</>
    );
  }

  return (
    <button
      type="button"
      className="text-left hover:underline"
      onClick={(event) => {
        event.stopPropagation();
        onItemClick(item);
      }}
    >
      {content}
    </button>
  );
};
