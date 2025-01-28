"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useState,
} from 'react';

export const SearchUIContext = createContext<{
  showId: boolean;
  setShowId: (showId: boolean) => void;
}>({
  showId: false,
  setShowId: () => {},
});

export const SearchUIProvider: FC<PropsWithChildren> = ({ children }) => {
  const [showId, setShowId] = useState(false);

  return (
    <SearchUIContext.Provider value={{ showId, setShowId }}>
      {children}
    </SearchUIContext.Provider>
  );
};
