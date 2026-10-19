import { FC, ReactNode } from "react";

type Props = { size?: number; className?: string };

export const FolderIcon: FC<Props> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h4.09a1.5 1.5 0 0 1 1.06.44L10 5.79c.28.28.66.44 1.06.44h5.44A1.5 1.5 0 0 1 18 7.73v6.77A1.5 1.5 0 0 1 16.5 16h-13A1.5 1.5 0 0 1 2 14.5v-9Z" />
  </svg>
);

export const FileIcon: FC<Props> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    className={className}
    aria-hidden
  >
    <path d="M5 2.75h6.5L15.25 6.5v10.75H5z" strokeLinejoin="round" />
    <path d="M11.25 2.75V6.75h4" strokeLinejoin="round" />
  </svg>
);

// The Squiggle squiggle.
export const SquiggleIcon: FC<Props> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    aria-hidden
  >
    <path
      d="M3 22 C 9 22, 10 6, 16 6 S 23 22, 29 22"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
    />
  </svg>
);

const Outline: FC<Props & { children: ReactNode }> = ({
  size = 16,
  className,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

// A window with a left panel: the Explorer toggle.
export const SidebarIcon: FC<Props> = (props) => (
  <Outline {...props}>
    <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="1.75" />
    <path d="M7.75 3.75v12.5" />
  </Outline>
);

export const FolderPlusIcon: FC<Props> = (props) => (
  <Outline {...props}>
    <path d="M2.75 6A1.25 1.25 0 0 1 4 4.75h3.4l1.6 1.75H16A1.25 1.25 0 0 1 17.25 7.75v7A1.25 1.25 0 0 1 16 16H4a1.25 1.25 0 0 1-1.25-1.25z" />
    <path d="M10 8.75v4.5M7.75 11h4.5" />
  </Outline>
);

// Two stacked chevrons pointing at a line: Collapse Folders in Explorer.
export const CollapseAllIcon: FC<Props> = (props) => (
  <Outline {...props}>
    <rect x="3.25" y="3.25" width="13.5" height="13.5" rx="1.75" />
    <path d="M7 10h6" />
  </Outline>
);

// Follow changes on disk.
export const EyeIcon: FC<Props> = (props) => (
  <Outline {...props}>
    <path d="M1.75 10S4.75 4.75 10 4.75 18.25 10 18.25 10 15.25 15.25 10 15.25 1.75 10 1.75 10z" />
    <circle cx="10" cy="10" r="2.5" />
  </Outline>
);
