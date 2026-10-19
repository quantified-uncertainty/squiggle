import { FC } from "react";

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
