'use client';
import { createContext, useContext } from 'react';
export const AccessContext = createContext({ access: null, refresh: () => {} });
export const useAccess = () => useContext(AccessContext);
