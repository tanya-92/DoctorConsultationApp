// hooks/useUserRole.ts
"use client";
import { onIdTokenChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export function useUserRole() {
  const [user] = useAuthState(auth);
  const [role, setRole] = useState("patient");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);


    
const unsubscribe = onSnapshot(
  userRef,
  (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      setRole(data.role || "patient");

      if (data.forceLogout) {
        // Reset flag and sign out
        setDoc(userRef, { forceLogout: false }, { merge: true })
          .finally(() => {
            signOut(auth).finally(() => {
              router.push("/login");
            });
          });
      }
    }
    setLoading(false);
  },
  (error) => {
    console.error("Error in user document listener:", error);

    if (error.code === "permission-denied") {
      console.warn("Lost permission — logging out...");
      signOut(auth).finally(() => {
        router.push("/login");
      });
    }

    setLoading(false);
  }
);


    return () => unsubscribe();
  }, [user, router]);

  // Optional helper if you use it elsewhere
  const updateRole = async (newRole: string) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), { role: newRole }, { merge: true });
    setRole(newRole);
  };

  return { role, updateRole, loading };
}
