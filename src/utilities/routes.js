import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser, ROLE } from "./UserContext";

// First screen after login, per role
export const landingFor = (user) => {
  switch (user?.user_type) {
    case ROLE.ADMIN: return "/admin";
    case ROLE.BRANCH:
    case ROLE.EXTERNAL: return "/home";
    default: return "/indents";
  }
};

/**
 * <Guard roles={["A"]}> - requires login (and one of the roles, when given).
 * Users flagged by an admin reset are sent to Change password first.
 */
export const Guard = ({ roles, children }) => {
  const { user } = useUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.must_change_pwd && location.pathname !== "/change-password") return <Navigate to="/change-password" replace />;
  if (roles && !roles.includes(user.user_type)) return <Navigate to={landingFor(user)} replace />;
  return children;
};
