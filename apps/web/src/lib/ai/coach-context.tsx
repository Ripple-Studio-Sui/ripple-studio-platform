'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface CoachContextValue {
  collectionId?: string;
  setCollectionId: (id?: string) => void;
}

const CoachContext = createContext<CoachContextValue | null>(null);

export function CoachProvider({ children }: { children: ReactNode }) {
  const [collectionId, setCollectionId] = useState<string | undefined>();

  return (
    <CoachContext.Provider value={{ collectionId, setCollectionId }}>
      {children}
    </CoachContext.Provider>
  );
}

export function useCoachContext() {
  const ctx = useContext(CoachContext);
  if (!ctx) throw new Error('useCoachContext must be used within CoachProvider');
  return ctx;
}