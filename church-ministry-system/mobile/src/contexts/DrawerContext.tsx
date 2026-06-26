import React, { createContext, useContext } from "react";

interface DrawerContextValue {
  openDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer must be used within DrawerProvider");
  return ctx;
}

export function DrawerProvider({
  children,
  openDrawer,
}: {
  children: React.ReactNode;
  openDrawer: () => void;
}) {
  return (
    <DrawerContext.Provider value={{ openDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}
