"use client";
import { SessionProvider } from "next-auth/react";
import { createContext, useContext } from "react";
const Catalog = createContext([]);
export default function CatalogProvider({
  offers,
  children,
  withSession = true,
}) {
  const content = (
    <Catalog.Provider value={offers}>{children}</Catalog.Provider>
  );
  return withSession ? <SessionProvider>{content}</SessionProvider> : content;
}
export function useCatalog() {
  return useContext(Catalog);
}
