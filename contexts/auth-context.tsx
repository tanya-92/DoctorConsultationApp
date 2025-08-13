// contexts/auth-context.tsx
"use client";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { type User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserData, updateUser, updateUserPassword, type UserData } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  updateUser: (data: Partial<UserData>) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  updateUser: async () => {},
  updateUserPassword: async () => {},
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
            console.log("User has no role assigned");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
          if (error instanceof Error && error.message.includes("not found")) {
            localStorage.removeItem("role");
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
          }
        }
      } else {
        setUserData(null);
        localStorage.removeItem("role");
        try {
          await fetch("/api/logout", { method: "POST" });
        } catch (error) {
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateUserProfile = async (data: Partial<UserData>) => {
    if (!user) {
      throw new Error("No authenticated user found");
    }
    try {
      const updatedData = await updateUser(user.uid, data);
      setUserData(updatedData);
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  };

  const updateUserPasswordProfile = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error("No authenticated user found");
    }
    try {
      await updateUserPassword(user.uid, currentPassword, newPassword);
    } catch (error) {
      console.error("Error updating user password:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, userData, loading, updateUser: updateUserProfile, updateUserPassword: updateUserPasswordProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};