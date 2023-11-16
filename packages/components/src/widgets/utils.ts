// We use an extra left margin for some elements to align them with parent variable name
export const leftWidgetMargin = "ml-1.5";

export const truncateStr = (str: string, maxLength: number) =>
  str.substring(0, maxLength) + (str.length > maxLength ? "..." : "");
