import { FC, useEffect, useState } from "react";

import { useCloseDropdown } from "@quri/ui";

export const useCloseDropdownOnInvariantChange = (invariant: unknown) => {
  const close = useCloseDropdown();
  const [initialInvariant] = useState(invariant);
  useEffect(() => {
    if (invariant !== initialInvariant) {
      close();
    }
  }, [invariant, initialInvariant, close]);
};

export const CloseDropdownOnInvariantChange: FC<{
  invariant: unknown;
}> = ({ invariant }) => {
  useCloseDropdownOnInvariantChange(invariant);

  return null;
};
