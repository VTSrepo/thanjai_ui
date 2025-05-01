// UserContext.js
import React, { createContext, useState, useContext } from 'react';

// Create the context
const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Default user is null (not logged in)
  if(!user&& JSON.parse(localStorage.getItem("user"))){
    setUser(JSON.parse(localStorage.getItem("user")))
  }

  const login = (userData) => {
    setUser(userData);
  };

  const logoutReset = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logoutReset }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext in any component
export const useUser = () => useContext(UserContext);
