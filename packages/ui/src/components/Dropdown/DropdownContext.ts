"use client";
import { createContext, useContext } from "react";

export const DropdownContext = createContext<{ closeDropdown: () => void }>({
  closeDropdown: () => {},
});

export function useCloseDropdown() {
  const { closeDropdown } = useContext(DropdownContext);
  return closeDropdown;
}
