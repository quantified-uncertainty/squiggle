import { FC } from "react";

import {
  Die1Icon,
  Die2Icon,
  Die3Icon,
  Die4Icon,
  Die5Icon,
  Die6Icon,
} from "./DieIcons.js";
import { DotsHorizontalIcon } from "./DotsHorizontalIcon.js";
import { EditIcon } from "./EditIcon.js";
import { EmptyIcon } from "./EmptyIcon.js";
import { ErrorIcon } from "./ErrorIcon.js";
import { ExternalLinkIcon } from "./ExternalLinkIcon.js";
import { FocusIcon } from "./FocusIcon.js";
import {
  AdjustmentsHorizontalIcon,
  AdjustmentsVerticalIcon,
  ArchiveBoxIcon,
  BackwardIcon,
  BarChartIcon,
  Bars3CenterLeftIcon,
  Bars4Icon,
  BoltIcon,
  BookOpenIcon,
  CalculatorIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardCopyIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
  Cog8ToothIcon,
  CommandLineIcon,
  CommentIcon,
  CubeTransparentIcon,
  CurlyBracketsIcon,
  DocumentTextIcon,
  FireIcon,
  GlobeIcon,
  GroupIcon,
  HashIcon,
  HelpIcon,
  LinkIcon,
  ListBulletIcon,
  LockIcon,
  PauseIcon,
  PlayIcon,
  PuzzleIcon,
  RectangleStackIcon,
  ResetIcon,
  RightArrowIcon,
  ScaleIcon,
  ScatterPlotIcon,
  SearchIcon,
  ShareIcon,
  SquareBracketIcon,
  TableCellsIcon,
  UserCircleIcon,
  UserIcon,
  VariableIcon,
  WrenchIcon,
} from "./HeroIcons.js";
import type { IconProps } from "./Icon.js";
import { PlusIcon } from "./PlusIcon.js";
import { RefreshIcon } from "./RefreshIcon.js";
import { SignOutIcon } from "./SignOutIcon.js";
import { TrashIcon } from "./TrashIcon.js";
import { TriangleIcon } from "./TriangleIcon.js";
import { XIcon } from "./XIcon.js";

export const allIconsMap: Record<string, FC<IconProps> | null> = {
  AdjustmentsHorizontalIcon,
  AdjustmentsVerticalIcon,
  ArchiveBoxIcon,
  BackwardIcon,
  BarChartIcon,
  Bars3CenterLeftIcon,
  Bars4Icon,
  BoltIcon,
  BookOpenIcon,
  CalculatorIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardCopyIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
  Cog8ToothIcon,
  CommandLineIcon,
  CommentIcon,
  CubeTransparentIcon,
  CurlyBracketsIcon,
  DocumentTextIcon,
  DotsHorizontalIcon,
  EditIcon,
  EmptyIcon,
  ErrorIcon,
  ExternalLinkIcon,
  FireIcon,
  FocusIcon,
  GlobeIcon,
  GroupIcon,
  HashIcon,
  HelpIcon,
  LinkIcon,
  ListBulletIcon,
  LockIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  PuzzleIcon,
  RectangleStackIcon,
  RefreshIcon,
  ResetIcon,
  RightArrowIcon,
  ScaleIcon,
  ScatterPlotIcon,
  SearchIcon,
  ShareIcon,
  SignOutIcon,
  SquareBracketIcon,
  TableCellsIcon,
  TrashIcon,
  TriangleIcon,
  UserCircleIcon,
  UserIcon,
  VariableIcon,
  WrenchIcon,
  XIcon,
  Die1Icon,
  Die2Icon,
  Die3Icon,
  Die4Icon,
  Die5Icon,
  Die6Icon,
};

const findByName = (name: string) => allIconsMap[name] || null;

export const IconByName: FC<IconProps & { name: string }> = ({
  name,
  ...props
}) => {
  const IconComponent = findByName(name);

  if (!IconComponent) {
    return null;
  }

  return <IconComponent {...props} />;
};
