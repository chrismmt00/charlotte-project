"use client";
import { SessionProvider } from "next-auth/react";
import { createContext, useContext } from "react";
const Catalog = createContext([]);
export default function CatalogProvider({ offers, children }) {
  return (
    <SessionProvider>
      <Catalog.Provider value={offers}>{children}</Catalog.Provider>
    </SessionProvider>
  );
}
export function useCatalog() {
  return useContext(Catalog);
}
