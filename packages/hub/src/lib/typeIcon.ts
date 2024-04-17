import {
  CalculatorIcon,
  CodeBracketIcon,
  CubeTransparentIcon,
  CurlyBracketsIcon,
  HashIcon,
  ShareIcon,
  SquareBracketIcon,
  TableCellsIcon,
} from "@quri/ui";

// I assume it would be appropriate to move this elsewhere, once we need it elsewhere.
export const exportTypeIcon = (type: string) => {
  switch (type) {
    case "Number":
      return HashIcon;
    case "Array":
      return SquareBracketIcon;
    case "Dict":
      return CurlyBracketsIcon;
    case "Lambda":
      return CodeBracketIcon;
    case "TableChart":
      return TableCellsIcon;
    case "Calculator":
      return CalculatorIcon;
    case "Specification":
      return CubeTransparentIcon;
    default:
      return ShareIcon;
  }
};
