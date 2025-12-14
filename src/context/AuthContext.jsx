// src\context\AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize token and role directly from localStorage
  const [token, setToken] = useState(() => localStorage.getItem("bl_token"));
  const [role, setRole] = useState(() => localStorage.getItem("bl_role"));

  useEffect(() => {
    // keep localStorage in sync when state changes
    if (token) localStorage.setItem("bl_token", token);
    else localStorage.removeItem("bl_token");

    if (role) localStorage.setItem("bl_role", role);
    else localStorage.removeItem("bl_role");
  }, [token, role]);

  const signIn = ({ token, role }) => {
    setToken(token);
    setRole(role);
    // explicitly sync localStorage too
    localStorage.setItem("bl_token", token);
    localStorage.setItem("bl_role", role);
  };

  const signOut = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem("bl_token");
    localStorage.removeItem("bl_role");
  };

  return (
    <AuthContext.Provider value={{ token, role, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}