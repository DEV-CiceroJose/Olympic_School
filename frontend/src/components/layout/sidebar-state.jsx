import { createContext, useContext, useState } from "react";

const SidebarState = createContext(null);

export function SidebarStateProvider({ children }) {
  const state = useState(true);
  return <SidebarState.Provider value={state}>{children}</SidebarState.Provider>;
}

export function useSidebarState() {
  return useContext(SidebarState);
}
