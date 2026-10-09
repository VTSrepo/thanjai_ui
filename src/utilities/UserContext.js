// UserContext.js - logged-in user + API token (kept in localStorage so a refresh keeps the session)
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "./service";

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
export const ROLE = { ADMIN: "A", OPS: "O", BRANCH: "B", KITCHEN: "K", EXTERNAL: "X" };
export const USER_TYPE_LABEL = { A: "Admin", O: "Operations Manager", K: "Kitchen", B: "Branch", X: "External customer" };

// Screen access from the user's role (Role Master). Admin users can do everything.
export const canUse = (user, screen, edit = false) => {
  if (!user) return false;
  if (user.user_type === "A") return true;
  const lvl = user.screens?.[screen];
  return !!lvl && (!edit || lvl === "E");
};

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

  // Refresh screens on start so role changes made by the admin apply without logging in again
  useEffect(() => {
    if (!read("authToken")) return;
    axios.get(`${API_URL}/me`).then((r) => {
      if (r.data?.user?.screens) updateUser({ screens: r.data.user.screens });
    }).catch(() => {});
  }, [updateUser]);

  const can = useCallback((screen, edit) => canUse(user, screen, edit), [user]);

  const logoutReset = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, can, login, updateUser, logoutReset, logout: logoutReset }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext in any component
export const useUser = () => useContext(UserContext);
