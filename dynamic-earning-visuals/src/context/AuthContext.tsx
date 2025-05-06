import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: any;
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  setUser: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // On mount, check for token in localStorage
    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");
    
    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
      setToken(accessToken);
    }
  }, []);

  const handleSetToken = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('accessToken', newToken);
    } else {
      localStorage.removeItem('accessToken');
    }
  };

  const login = (newToken: string, userData: any) => {
    setToken(newToken);
    localStorage.setItem("accessToken", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const updateUser = (userData: any) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        token, 
        setToken: handleSetToken, 
        isAuthenticated: !!token,
        login,
        logout,
        setUser: updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};