import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUser, ROLE, canUse } from "./UserContext";

// First screen after login
export const landingFor = (user) => {
  switch (user?.user_type) {
    case ROLE.BRANCH:
    case ROLE.EXTERNAL: return "/home";
    case ROLE.KITCHEN: return "/indents";
    default:
      if (canUse(user, "DASHBOARD")) return "/admin";
      if (canUse(user, "BATCHES")) return "/batches";
      if (canUse(user, "INDENTS")) return "/indents";
      return "/change-password";
  }
};

/**
 * <Guard roles={["B"]} screens={["PAYMENTS"]}> - requires login; passes when the user type is in roles
 * OR the user's role can open one of the screens (admin always passes). Neither given = any logged-in user.
 * Users flagged by an admin reset are sent to Change password first.
 */
export const Guard = ({ roles, screens, children }) => {
  const { user } = useUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.must_change_pwd && location.pathname !== "/change-password") return <Navigate to="/change-password" replace />;
  const limited = (roles && roles.length) || (screens && screens.length);
  const allowed = !limited || user.user_type === ROLE.ADMIN || (roles || []).includes(user.user_type)
    || (screens || []).some((s) => canUse(user, s));
  if (!allowed) {
    const home = landingFor(user);
    return home === location.pathname ? <Navigate to="/change-password" replace /> : <Navigate to={home} replace />;
  }
  return children;
};
