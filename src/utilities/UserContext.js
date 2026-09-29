// UserContext.js - logged-in user + API token (kept in localStorage so a refresh keeps the session)
import React, { createContext, useCallback, useContext, useState } from "react";

const UserContext = createContext();

const read = (key) => {
  try {
    const v = localStorage.getItem(key);
    return key === "user" ? (v ? JSON.parse(v) : null) : v;
  } catch (e) {
    return null;
  }
};

export const clearSession = () => {
  try {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  } catch (e) {}
};

// Role codes used across the app
export const ROLE = { ADMIN: "A", BRANCH: "B", KITCHEN: "K", EXTERNAL: "X" };

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => (read("authToken") ? read("user") : null));

  const login = useCallback((userData, token) => {
    try {
      localStorage.setItem("user", JSON.stringify(userData));
      if (token) localStorage.setItem("authToken", token);
    } catch (e) {}
    setUser(userData);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((u) => {
      const next = { ...(u || {}), ...patch };
      try {
        localStorage.setItem("user", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const logoutReset = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, login, updateUser, logoutReset, logout: logoutReset }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext in any component
export const useUser = () => useContext(UserContext);
