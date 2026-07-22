import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const AuthContext = createContext(null);
const AUTH_CACHE_KEY = "rabbitcv_current_user";

function readCachedUser() {
  try {
    const cachedUser = sessionStorage.getItem(AUTH_CACHE_KEY);
    return cachedUser ? JSON.parse(cachedUser) : null;
  } catch {
    return null;
  }
}

function cacheUser(user) {
  try {
    if (user) {
      sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(AUTH_CACHE_KEY);
    }
  } catch {
    // The app can still use the in-memory state when storage is unavailable.
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(readCachedUser);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const authRevisionRef = useRef(0);

  const fetchCurrentUser = useCallback(async () => {
    const requestRevision = authRevisionRef.current;
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (requestRevision !== authRevisionRef.current) return;

      if (res.ok) {
        const data = await res.json();
        const user = data.user || null;
        setCurrentUser(user);
        cacheUser(user);
      } else if (res.status === 401 || res.status === 403) {
        setCurrentUser(null);
        cacheUser(null);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    } finally {
      setIsAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = useCallback((user) => {
    authRevisionRef.current += 1;
    setCurrentUser(user);
    cacheUser(user);
    setIsAuthChecked(true);
  }, []);

  const logout = useCallback(() => {
    authRevisionRef.current += 1;
    setCurrentUser(null);
    cacheUser(null);
    setIsAuthChecked(true);
  }, []);

  const value = {
    currentUser,
    isAuthChecked,
    login,
    logout,
    refreshUser: fetchCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
