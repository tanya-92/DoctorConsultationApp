// auth-context.tsx
"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { type User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserData, type UserData } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        try {
          // Set token cookie when user is authenticated
          const token = await user.getIdToken();
          await fetch("/api/setToken", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          });

          const data = await getUserData(user.uid);
          setUserData(data);

          if (data?.role) {
            localStorage.setItem("role", data.role);
          } else {
            // For users without a role in Firestore, don't clear everything
            // They might be valid users who just don't have a role assigned yet
            console.log("User has no role assigned");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Don't clear everything on error, just set userData to null
          setUserData(null);
          // Only clear token if it's actually invalid
          if (error instanceof Error && error.message.includes("not found")) {
            localStorage.removeItem("role");
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
          }
        }
      } else {
        // User is not authenticated
        setUserData(null);
        localStorage.removeItem("role");
        // Clear token cookie when user logs out
        try {
          await fetch("/api/logout", { method: "POST" });
        } catch (error) {
          // Fallback to client-side cookie clearing
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, userData, loading }}>{children}</AuthContext.Provider>;
};