"use client";

import { createContext, useContext, ReactNode } from "react";

export interface User {
  id: number;
  publicId: string;
  name: string;
  phone: string;
  bankAccountNumber: string | null;
  bankIFSCCode: string | null;
  upiId: string | null;
  createdAt: string;
  updatedAt: string;
}

const UserContext = createContext<User | null>(null);

export const UserProvider = ({ user, children }: { user: User | null, children: ReactNode }) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
